import { test } from "node:test";
import assert from "node:assert/strict";
import { alertDraftInput } from "../src/lib/alert-contract";
test("alert drafts require bounded content and independent versions; reject forged ownership and publication controls", () => {
  const value = {
    title: "Alerta ficticia",
    body: "Texto ficticio de alerta privada para revisión humana.",
    reportVersion: 2,
    draftVersion: 0,
  };
  assert.equal(alertDraftInput.safeParse(value).success, true);
  assert.equal(
    alertDraftInput.safeParse({
      ...value,
      source: { kind: "initial", id: crypto.randomUUID() },
    }).success,
    true,
  );
  for (const bad of [
    { ...value, title: "   " },
    { ...value, title: "x".repeat(161) },
    { ...value, body: "x".repeat(6001) },
    { ...value, reportVersion: 0 },
    { ...value, draftVersion: -1 },
    { ...value, created_by: "forged" },
    { ...value, published: true },
    { ...value, source: { kind: "original", id: crypto.randomUUID() } },
    { ...value, source: { kind: "prepared", id: "invalid" } },
  ])
    assert.equal(alertDraftInput.safeParse(bad).success, false);
});
