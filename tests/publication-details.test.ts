import { test } from "node:test";
import assert from "node:assert/strict";
import { publicationInput } from "../src/server/reports";
const base = {
  title: "Publicación ficticia",
  body: "Versión pública ficticia suficientemente extensa.",
  privacyConfirmed: true,
  publicationConfirmed: true,
  version: 2,
};
test("publication keeps legacy compatibility and rejects unapproved or invalid structured fields", () => {
  const old = publicationInput.parse(base);
  assert.deepEqual(old.categories, []);
  assert.equal(old.summary, "");
  const valid = {
    ...base,
    categories: ["acoso"],
    summary: "Resumen ficticio",
    context: "Contexto ficticio",
    findings: "Hallazgos ficticios",
    analysis: "Análisis ficticio",
    limitations: "Limitaciones del ejemplo ficticio.",
  };
  assert.equal(publicationInput.safeParse(valid).success, true);
  for (const changes of [
    { categories: ["unknown"] },
    { categories: ["acoso", "acoso"] },
    { categories: ["acoso", "amenaza", "doxing", "barrera", "odio"] },
    { summary: "x".repeat(801) },
    { analysis: "Análisis sin límites", limitations: "" },
    { privacyConfirmed: false },
    { publicationConfirmed: false },
    { internalNotes: "No publicar" },
  ])
    assert.equal(
      publicationInput.safeParse({ ...valid, ...changes }).success,
      false,
    );
});
