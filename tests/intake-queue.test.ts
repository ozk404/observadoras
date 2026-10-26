import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { db } from "../src/server/db";
import { runIntakeOnce } from "../src/server/intake";
import { aiConfiguration } from "../src/server/openai";

test(
  "expired leases recover once and concurrent claims do not duplicate completed results",
  {
    skip:
      process.env.TEST_DATABASE_MIGRATIONS !== "true" ||
      !aiConfiguration().simulation,
  },
  async () => {
    const id = randomUUID();
    try {
      const image = await sharp({
        create: { width: 32, height: 32, channels: 3, background: "#fff" },
      })
        .webp()
        .toBuffer();
      await db.query(
        "INSERT INTO reports(id,title,description,status) VALUES($1,'Fixture de recuperación','relato ficticio de desinformación para revisar participación política sin identificadores.','pending')",
        [id],
      );
      await db.query(
        "INSERT INTO report_evidence(report_id,content,width,height,sha256) VALUES($1,$2,32,32,$3)",
        [id, image, createHash("sha256").update(image).digest("hex")],
      );
      await db.query(
        "INSERT INTO intake_analyses(id,report_id,report_version,synthetic_confirmed,ai_consent,consent_version,consented_at,state,attempts,lease_token,lease_until) VALUES($1,$2,1,true,true,'2026-10-26-reports-v1',now(),'processing',1,$3,now()-interval '1 second')",
        [randomUUID(), id, randomUUID()],
      );
      await Promise.all([runIntakeOnce(), runIntakeOnce()]);
      for (let i = 0; i < 50; i++) {
        const row = (
          await db.query(
            "SELECT state,attempts,result,lease_token FROM intake_analyses WHERE report_id=$1",
            [id],
          )
        ).rows[0];
        if (row.state === "completed") {
          assert.equal(row.attempts, 2);
          assert.equal(row.lease_token, null);
          assert.equal(row.result.assessment, "needs_context");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert.fail("Recovered job did not complete");
    } finally {
      await db.query("DELETE FROM intake_analyses WHERE report_id=$1", [id]);
      await db.query("DELETE FROM report_evidence WHERE report_id=$1", [id]);
      await db.query("DELETE FROM reports WHERE id=$1", [id]);
      await db.end();
    }
  },
);
