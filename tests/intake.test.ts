import { test } from "node:test";
import assert from "node:assert/strict";
import { requestIntakeSuggestion } from "../src/server/openai";
import { intakeSuggestionSchema } from "../src/lib/ai-contract";
import { validationInput, publicSubmission } from "../src/server/reports";
const result = {
  categories: ["desinformacion"],
  summary: "Relato ficticio que requiere revisar el contexto descrito.",
  limitations:
    "La captura no demuestra autenticidad ni veracidad de los hechos.",
  assessment: "needs_context",
  assessmentReason: "Falta contexto suficiente para evaluar la pertinencia.",
  evidenceNotes: "La imagen muestra un ejemplo sintético de una publicación.",
  observations: ["Comparar el contenido visible con la descripción recibida."],
  missingInformation: ["Falta contexto temporal."],
};
test("multimodal intake sends private image inline with strict structured output and no storage", async () => {
  let payload: any;
  const image = Buffer.from("synthetic-image-fixture");
  const response = await requestIntakeSuggestion(
    "Descripción ficticia sin identificadores.",
    image,
    {
      apiKey: "fictional-key",
      model: "test-model",
      fetcher: (async (_url, init) => {
        payload = JSON.parse(init!.body as string);
        return Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: JSON.stringify(result) }],
            },
          ],
        });
      }) as typeof fetch,
    },
  );
  assert.deepEqual(response, result);
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.name, "observadoras_intake");
  assert.equal(payload.text.format.strict, true);
  assert.deepEqual(payload.input[0].content[1], {
    type: "input_image",
    image_url: `data:image/webp;base64,${image.toString("base64")}`,
    detail: "high",
  });
  assert.equal(payload.tools, undefined);
});
test("intake rejects claims of verified truth, unknown categories and forged decisions", () => {
  for (const value of [
    { ...result, assessment: "verified" },
    { ...result, categories: ["unknown"] },
    { ...result, approved: true },
    { ...result, observations: [] },
  ])
    assert.equal(intakeSuggestionSchema.safeParse(value).success, false);
  assert.equal(
    publicSubmission.safeParse({
      description: "Un relato de prueba suficientemente largo.",
      consent: true,
      website: "",
      token: "token",
      submissionKey: crypto.randomUUID(),
      syntheticConfirmed: false,
    }).success,
    false,
  );
  assert.equal(
    validationInput.safeParse({
      confirmed: true,
      version: 1,
      reviewedCategories: ["unknown"],
    }).success,
    false,
  );
});
