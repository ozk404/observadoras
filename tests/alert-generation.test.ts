import { test } from "node:test";
import assert from "node:assert/strict";
import { requestAlertSuggestion, ProviderError } from "../src/server/openai";
import {
  alertGenerationInput,
  alertSuggestionSchema,
} from "../src/lib/alert-contract";
const proposal = {
  title: "Alerta sobre un relato ficticio",
  body: "Un relato ficticio requiere revisión humana antes de cualquier acción.",
  limitations: "No existe verificación independiente del contenido aportado.",
};
const envelope = (content: unknown) => ({
  status: "completed",
  output: [{ type: "message", role: "assistant", content }],
});
test("alert generation requires privacy-reviewed text and strict bounded proposals", () => {
  const input = {
    text: "Relato ficticio preparado para generar una alerta interna.",
    privacyConfirmed: true,

    reportVersion: 2,
    draftVersion: 0,
  };
  assert.equal(alertGenerationInput.safeParse(input).success, true);
  for (const bad of [
    { ...input, privacyConfirmed: false },
    { ...input, syntheticConfirmed: false },
    { ...input, reportVersion: 0 },
    { ...input, draftVersion: -1 },
    { ...input, text: "x".repeat(6001) },
    { ...input, requested_by: "forged" },
  ])
    assert.equal(alertGenerationInput.safeParse(bad).success, false);
  for (const bad of [
    { ...proposal, approved: true },
    { ...proposal, title: "x".repeat(161) },
    { ...proposal, body: "x".repeat(6001) },
    { ...proposal, limitations: "" },
  ])
    assert.equal(alertSuggestionSchema.safeParse(bad).success, false);
});
test("alert Responses request contains only prepared text, strict output and store:false", async () => {
  let payload: any;
  const result = await requestAlertSuggestion(
    "Texto ficticio preparado explícitamente.",
    {
      apiKey: "fictional-key",
      model: "test-model",
      fetcher: (async (url, init) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        assert.equal(init?.redirect, "error");
        payload = JSON.parse(init!.body as string);
        return Response.json(
          envelope([{ type: "output_text", text: JSON.stringify(proposal) }]),
        );
      }) as typeof fetch,
    },
  );
  assert.deepEqual(result, proposal);
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.name, "observadoras_alert_draft");
  assert.equal(payload.text.format.strict, true);
  assert.equal(payload.max_output_tokens, 2500);
  assert.equal(payload.tools, undefined);
  assert.deepEqual(payload.input, [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: "Texto ficticio preparado explícitamente.",
        },
      ],
    },
  ]);
  for (const term of ["report_id", "sourceUrl", "input_image", "author_id"])
    assert.equal(JSON.stringify(payload).includes(term), false);
});
test("refusal, invalid schema, incomplete response and timeout do not become alert proposals", async () => {
  for (const response of [
    envelope([{ type: "refusal", refusal: "fixture" }]),
    envelope([
      {
        type: "output_text",
        text: JSON.stringify({ ...proposal, published: true }),
      },
    ]),
    { status: "incomplete", output: [] },
  ])
    await assert.rejects(
      requestAlertSuggestion("Texto ficticio preparado para la prueba.", {
        apiKey: "fictional",
        model: "test",
        fetcher: (async () => Response.json(response)) as typeof fetch,
      }),
      ProviderError,
    );
  await assert.rejects(
    requestAlertSuggestion("Texto ficticio preparado para timeout.", {
      apiKey: "fictional",
      model: "test",
      timeoutMs: 5,
      fetcher: ((_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          ),
        )) as typeof fetch,
    }),
    (error) => error instanceof ProviderError && error.code === "timeout",
  );
});
