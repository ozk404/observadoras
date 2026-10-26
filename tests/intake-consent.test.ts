import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "../src/server/db";
import { createReport } from "../src/server/reports";
import { runIntakeOnce, retryIntake } from "../src/server/intake";
import { aiConfiguration } from "../src/server/openai";
import { AI_CONSENT_VERSION } from "../src/lib/consent";
import { HttpError } from "../src/server/security";

test("new consent is versioned and historical synthetic declarations cannot authorize processing or retry", {
  skip: process.env.TEST_DATABASE_MIGRATIONS !== "true" || !aiConfiguration().simulation,
}, async () => {
  const userId = randomUUID();
  let reportId: string | null = null;
  try {
    await db.query("INSERT INTO users(id,username,password_hash,role) VALUES($1,$2,'not-a-login-hash','reviewer')", [userId, `fixture-${userId}`]);
    const content = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#fff" } }).webp().toBuffer();
    reportId = await createReport("Reporte ficticio de consentimiento", "Relato ficticio para comprobar consentimiento sin datos personales.", null, true, randomUUID(), {
      sourceUrl: "", aiConsent: true, evidence: { content, width: 16, height: 16, sha256: "fixture" },
    });
    let row = (await db.query("SELECT * FROM intake_analyses WHERE report_id=$1", [reportId])).rows[0];
    assert.equal(row.ai_consent, true);
    assert.equal(row.consent_version, AI_CONSENT_VERSION);
    assert.ok(row.consented_at instanceof Date);
    assert.equal(row.synthetic_confirmed, false);
    await db.query("UPDATE intake_analyses SET ai_consent=false,consent_version=NULL,consented_at=NULL,synthetic_confirmed=true WHERE report_id=$1", [reportId]);
    await runIntakeOnce();
    row = (await db.query("SELECT * FROM intake_analyses WHERE report_id=$1", [reportId])).rows[0];
    assert.equal(row.state, "blocked");
    assert.equal(row.error_code, "privacy");
    assert.equal(row.result, null);
    assert.equal(row.transport, null);
    await assert.rejects(retryIntake({id:userId,username:"fixture",role:"reviewer"}, reportId!, {confirmed:true,version:1}), (error) => error instanceof HttpError && error.status===409);
  } finally {
    if(reportId) {
      await db.query("DELETE FROM intake_analyses WHERE report_id=$1", [reportId]);
      await db.query("DELETE FROM report_evidence WHERE report_id=$1", [reportId]);
      await db.query("DELETE FROM report_events WHERE report_id=$1", [reportId]);
      await db.query("DELETE FROM reports WHERE id=$1", [reportId]);
    }
    await db.query("DELETE FROM users WHERE id=$1", [userId]);
    await db.end();
  }
});
