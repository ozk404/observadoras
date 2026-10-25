import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requestSuggestion,
  ProviderError,
  aiConfiguration,
} from "../src/server/openai";
import { sensitiveSignals, redactCommonIdentifiers } from "../src/lib/privacy";
import { aiInputSchema } from "../src/lib/ai-contract";
const suggestion = {
  categories: ["desinformacion"],
  summary:
    "Se describe una situación ficticia que requiere revisión de contexto.",
  limitations: "No hay verificación independiente de los hechos descritos.",
};
const envelope = (content: unknown) => ({
  status: "completed",
  output: [{ type: "message", role: "assistant", content }],
});
test("sensitive input is detected and common identifiers can be removed locally", () => {
  const sample =
    "Mi nombre es María López. Correo prueba@example.test, teléfono +502 5555 1234, usuario @ejemplo y https://example.test/caso.";
  assert.ok(sensitiveSignals(sample).length >= 4);
  const cleaned = redactCommonIdentifiers(sample);
  assert.equal(cleaned.includes("María"), false);
  assert.equal(cleaned.includes("5555"), false);
  assert.equal(cleaned.includes("example.test"), false);
  assert.deepEqual(sensitiveSignals(cleaned), []);
  assert.ok(
    sensitiveSignals(
      "Una referencia a María López dentro del relato.",
    ).includes("posible nombre compuesto"),
  );
});
test("preparation requires both confirmations and a matching report version", () => {
  const input = {
    text: "Un relato ficticio con contenido preparado para análisis.",
    privacyConfirmed: true,
    syntheticConfirmed: true,
    version: 1,
  };
  assert.equal(aiInputSchema.safeParse(input).success, true);
  assert.equal(
    aiInputSchema.safeParse({ ...input, privacyConfirmed: false }).success,
    false,
  );
  assert.equal(
    aiInputSchema.safeParse({ ...input, syntheticConfirmed: false }).success,
    false,
  );
  assert.equal(
    aiInputSchema.safeParse({ ...input, version: undefined }).success,
    false,
  );
});
test("Responses request carries only prepared text, bounded output and store:false", async () => {
  let payload: Record<string, unknown> | undefined;
  const fetcher = (async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(init?.redirect, "error");
    payload = JSON.parse(init?.body as string);
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer fictional-key",
    );
    return Response.json(
      envelope([{ type: "output_text", text: JSON.stringify(suggestion) }]),
    );
  }) as typeof fetch;
  const result = await requestSuggestion("Solo texto preparado ficticio.", {
    model: "test-model",
    apiKey: "fictional-key",
    fetcher,
  });
  assert.deepEqual(result, suggestion);
  assert.equal(payload?.store, false);
  assert.equal(payload?.max_output_tokens, 1800);
  assert.deepEqual(payload?.input, [
    {
      role: "user",
      content: [{ type: "input_text", text: "Solo texto preparado ficticio." }],
    },
  ]);
  assert.equal(JSON.stringify(payload).includes("report_id"), false);
  assert.equal(JSON.stringify(payload).includes("author_id"), false);
  assert.equal(JSON.stringify(payload).includes("risk"), false);
});
test("refusal, incomplete, invalid schema and oversized provider bodies never become suggestions", async () => {
  for (const value of [
    envelope([{ type: "refusal", refusal: "refused" }]),
    { status: "incomplete", output: [] },
    envelope([{ type: "output_text", text: "invalid json" }]),
    envelope([
      {
        type: "output_text",
        text: JSON.stringify({ ...suggestion, risk: "high" }),
      },
    ]),
    envelope([{ type: "output_text", text: "x".repeat(65000) }]),
  ]) {
    await assert.rejects(
      requestSuggestion("Texto ficticio preparado.", {
        model: "test",
        apiKey: "fake",
        fetcher: (async () => Response.json(value)) as typeof fetch,
      }),
      ProviderError,
    );
  }
});
test("timeouts and provider failure return safe codes, not private response details", async () => {
  await assert.rejects(
    requestSuggestion("Texto ficticio.", {
      model: "test",
      apiKey: "fake",
      fetcher: (async () =>
        new Response("private debug details", { status: 500 })) as typeof fetch,
    }),
    (error) =>
      error instanceof ProviderError &&
      error.code === "unavailable" &&
      !error.message.includes("private"),
  );
  const fetcher = ((_url, init) =>
    new Promise((_resolve, reject) =>
      init?.signal?.addEventListener("abort", () =>
        reject(new Error("aborted")),
      ),
    )) as typeof fetch;
  await assert.rejects(
    requestSuggestion("Texto ficticio.", {
      model: "test",
      apiKey: "fake",
      fetcher,
      timeoutMs: 5,
    }),
    (error) => error instanceof ProviderError && error.code === "timeout",
  );
});
test("configuration fails closed for data modes and unsafe simulation endpoints", () => {
  const snapshot = { ...process.env };
  try {
    process.env.OPENAI_API_KEY = "fake";
    process.env.OPENAI_MODEL = "model";
    process.env.AI_DATA_MODE = "real";
    assert.equal(aiConfiguration().ready, false);
    process.env.AI_DATA_MODE = "synthetic";
    delete process.env.AI_TEST_MODE;
    assert.equal(aiConfiguration().ready, true);
    process.env.AI_TEST_MODE = "true";
    process.env.OPENAI_TEST_ENDPOINT = "https://foreign.test";
    assert.equal(aiConfiguration().ready, false);
    process.env.APP_ORIGIN = "http://localhost:3100";
    process.env.OPENAI_TEST_ENDPOINT = "http://openai-mock:4000/v1/responses";
    assert.equal(aiConfiguration().simulation, true);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in snapshot)) delete process.env[key];
    Object.assign(process.env, snapshot);
  }
});
