import { AI_CONSENT_VERSION } from "../src/lib/consent";
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/server/password";
import {
  checkOrigin,
  formToken,
  verifyFormToken,
  readJson,
} from "../src/server/security";
import {
  publicationInput,
  publicSubmission,
  draftInput,
  validationInput,
  adjustmentInput,
} from "../src/server/reports";
process.env.AUTH_SECRET =
  "test-only-secret-with-more-than-thirty-two-characters";
process.env.APP_ORIGIN = "http://localhost:3000";
test("adjustments require a meaningful private note, explicit confirmation and version", () => {
  const value = {
    note: "Aclara el contexto ficticio sin añadir datos personales.",
    confirmed: true,
    version: 1,
  };
  assert.equal(adjustmentInput.safeParse(value).success, true);
  for (const bad of [
    { ...value, note: "   " },
    { ...value, note: "x".repeat(2001) },
    { ...value, confirmed: false },
    { ...value, version: 0 },
    { ...value, requested_by: "forged" },
  ])
    assert.equal(adjustmentInput.safeParse(bad).success, false);
});
test("internal validation requires explicit confirmation and a version; rejects forged actor fields", () => {
  assert.equal(
    validationInput.safeParse({ confirmed: true, version: 1 }).success,
    true,
  );
  for (const value of [
    { confirmed: false, version: 1 },
    { version: 1 },
    { confirmed: true },
    { confirmed: true, version: 0 },
    { confirmed: true, version: 1, validated_by: "forged" },
  ])
    assert.equal(validationInput.safeParse(value).success, false);
});
test("password hashes use individual salts; invalid password fails", async () => {
  const a = await hashPassword("fictional-password-123");
  const b = await hashPassword("fictional-password-123");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("fictional-password-123", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
});
test("state-changing requests reject foreign and missing origins", () => {
  assert.throws(() =>
    checkOrigin(
      new Request("http://localhost:3000", {
        headers: { origin: "https://foreign.test" },
      }),
    ),
  );
  assert.throws(() => checkOrigin(new Request("http://localhost:3000")));
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3000", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
  );
});
test("public token rejects tampering and automated immediate submission", () => {
  const token = formToken();
  assert.throws(() => verifyFormToken(token));
  assert.throws(() => verifyFormToken(token.slice(0, -1) + "X"));
  assert.throws(() => verifyFormToken("invalid"));
});
test("public intake requires notice acknowledgement and empty honeypot", () => {
  const sample = {
    description: "Descripción ficticia suficientemente extensa.",
    consent: true, consentVersion: AI_CONSENT_VERSION,

    website: "",
    token: "token",
    submissionKey: "00000000-0000-4000-8000-000000000001",
  };
  assert.equal(publicSubmission.safeParse(sample).success, true);
  assert.equal(
    publicSubmission.safeParse({ ...sample, consent: false }).success,
    false,
  );
  assert.equal(
    publicSubmission.safeParse({ ...sample, website: "bot.test" }).success,
    false,
  );
  assert.equal(
    publicSubmission.safeParse({ ...sample, status: "published" }).success,
    false,
  );
});
test("publication requires independent privacy and publication confirmation plus version", () => {
  const sample = {
    title: "Síntesis pública",
    body: "Un texto ficticio revisado y preparado para publicación.",
    privacyConfirmed: true,
    publicationConfirmed: true,
    version: 1,
  };
  assert.equal(publicationInput.safeParse(sample).success, true);
  assert.equal(
    publicationInput.safeParse({ ...sample, privacyConfirmed: false }).success,
    false,
  );
  assert.equal(
    publicationInput.safeParse({ ...sample, publicationConfirmed: false })
      .success,
    false,
  );
  assert.equal(
    publicationInput.safeParse({ ...sample, version: undefined }).success,
    false,
  );
  assert.equal(
    draftInput.safeParse({ title: "Borrador", description: "", submit: false })
      .success,
    true,
  );
});
test("body limit is enforced even without content-length", async () => {
  await assert.rejects(
    readJson(
      new Request("http://localhost:3000", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "x".repeat(27000) }),
      }),
    ),
  );
});
