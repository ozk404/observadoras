import { test } from "node:test";
import assert from "node:assert/strict";
import { followupInput } from "../src/lib/followup-contract";
test("follow-up requires meaningful text, a current version and explicit closure confirmation", () => {
  const value = {
    action: "note",
    note: "Una observación ficticia para seguimiento.",
    version: 2,
  };
  assert.equal(followupInput.safeParse(value).success, true);
  assert.equal(
    followupInput.safeParse({ ...value, action: "close", confirmed: true })
      .success,
    true,
  );
  for (const invalid of [
    { ...value, note: "   " },
    { ...value, note: "x".repeat(2001) },
    { ...value, version: 0 },
    { ...value, action: "close" },
    { ...value, action: "close", confirmed: false },
    { ...value, reviewer_id: "forged" },
    { ...value, created_at: "forged" },
    { ...value, action: "reopen" },
  ])
    assert.equal(followupInput.safeParse(invalid).success, false);
});
