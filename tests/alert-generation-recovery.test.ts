import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { aiConfiguration } from "../src/server/openai";
import { generateAlert } from "../src/server/alert-generations";
import { HttpError } from "../src/server/security";
test(
  "expired alert work and revoked reviewers cannot retain a result; abandoned work recovers safely",
  {
    skip:
      process.env.TEST_DATABASE_MIGRATIONS !== "true" ||
      !aiConfiguration().simulation,
  },
  async () => {
    const reportId = randomUUID(),
      userId = randomUUID();
    const user = {
      id: userId,
      username: "fictional-worker-reviewer",
      role: "reviewer" as const,
    };
    const input = (
      text = "Relato ficticio para preparar una alerta interna sin identificadores.",
    ) => ({
      text,
      privacyConfirmed: true,

      reportVersion: 2,
      draftVersion: 0,
    });
    async function running() {
      for (let i = 0; i < 50; i++) {
        const row = (
          await db.query(
            "SELECT id FROM alert_generations WHERE report_id=$1 AND status='running'",
            [reportId],
          )
        ).rows[0];
        if (row) return row.id;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw Error("No running fixture");
    }
    try {
      await db.query(
        "INSERT INTO users(id,username,password_hash,role) VALUES($1,$2,'not-a-login-hash','reviewer')",
        [userId, `fixture-${userId}`],
      );
      await db.query(
        "INSERT INTO reports(id,title,description,status,version,validated_by,validated_at,validation_source) VALUES($1,'Fixture de propuesta','Relato enteramente ficticio para recuperación.','validated',2,$2,now(),'explicit')",
        [reportId, userId],
      );
      const expired = generateAlert(
        user,
        reportId,
        input(
          "Relato ficticio para simular demora alerta y comprobar su vencimiento.",
        ),
      );
      const expiredCheck = assert.rejects(
        expired,
        (error) => error instanceof HttpError && error.status === 409,
      );
      const expiredId = await running();
      await db.query(
        "UPDATE alert_generations SET created_at=now()-interval '3 minutes' WHERE id=$1",
        [expiredId],
      );
      await expiredCheck;
      const failed = (
        await db.query(
          "SELECT status,result,error_code FROM alert_generations WHERE id=$1",
          [expiredId],
        )
      ).rows[0];
      assert.equal(failed.status, "failed");
      assert.equal(failed.result, null);
      assert.equal(failed.error_code, "timeout");
      const abandonedId = randomUUID();
      await db.query(
        "INSERT INTO alert_generations(id,report_id,report_version,draft_version,requested_by,input_hash,model,transport,status,created_at) VALUES($1,$2,2,0,$3,'fixture-hash','test-model','simulation','running',now()-interval '3 minutes')",
        [abandonedId, reportId, userId],
      );
      assert.equal(
        (await generateAlert(user, reportId, input())).status,
        "succeeded",
      );
      assert.equal(
        (
          await db.query(
            "SELECT error_code FROM alert_generations WHERE id=$1",
            [abandonedId],
          )
        ).rows[0].error_code,
        "timeout",
      );
      const revoked = generateAlert(
        user,
        reportId,
        input("Relato ficticio para simular demora alerta y revocar permisos."),
      );
      const revokedCheck = assert.rejects(
        revoked,
        (error) => error instanceof HttpError && error.status === 409,
      );
      const revokedId = await running();
      await db.query("UPDATE users SET enabled=false WHERE id=$1", [userId]);
      await revokedCheck;
      assert.equal(
        (
          await db.query("SELECT result FROM alert_generations WHERE id=$1", [
            revokedId,
          ])
        ).rows[0].result,
        null,
      );
    } finally {
      await db.query("DELETE FROM alert_generations WHERE report_id=$1", [
        reportId,
      ]);
      await db.query("DELETE FROM reports WHERE id=$1", [reportId]);
      await db.query("DELETE FROM users WHERE id=$1", [userId]);
      await db.end();
    }
  },
);
