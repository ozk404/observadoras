import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
test(
  "validation migration preserves prior human publications without inventing explicit validations",
  { skip: process.env.TEST_DATABASE_MIGRATIONS !== "true" },
  async () => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const schema = `migration_test_${randomUUID().replaceAll("-", "")}`;
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET LOCAL search_path TO ${schema}`);
      await client.query(
        await readFile("db/migrations/001_initial.sql", "utf8"),
      );
      await client.query(
        await readFile("db/migrations/002_ai_analyses.sql", "utf8"),
      );
      const userId = randomUUID();
      const reportId = randomUUID();
      const pendingId = randomUUID();
      const publicationId = randomUUID();
      await client.query(
        "INSERT INTO users(id,username,password_hash,role) VALUES($1,'fictional-reviewer','not-a-login-hash','reviewer')",
        [userId],
      );
      await client.query(
        "INSERT INTO reports(id,title,description,status) VALUES($1,'Original privado ficticio','Contenido original ficticio que se conserva.','published'),($2,'Pendiente ficticio','Un relato pendiente que sigue privado.','pending')",
        [reportId, pendingId],
      );
      await client.query(
        "INSERT INTO publications(id,report_id,title,body,published_by,published_at) VALUES($1,$2,'Versión pública ficticia','Contenido público ficticio revisado previamente.',$3,'2026-01-02T12:00:00Z')",
        [publicationId, reportId, userId],
      );
      await client.query(
        await readFile("db/migrations/003_internal_validation.sql", "utf8"),
      );
      const row = (
        await client.query("SELECT * FROM reports WHERE id=$1", [reportId])
      ).rows[0];
      assert.equal(row.status, "published");
      assert.equal(
        row.description,
        "Contenido original ficticio que se conserva.",
      );
      assert.equal(row.validated_by, userId);
      assert.equal(row.validated_at.toISOString(), "2026-01-02T12:00:00.000Z");
      assert.equal(row.validation_source, "legacy_publication");
      assert.equal(
        (
          await client.query("SELECT id FROM publications WHERE report_id=$1", [
            reportId,
          ])
        ).rows[0].id,
        publicationId,
      );
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM report_events WHERE action='validated'",
          )
        ).rows[0].total,
        0,
      );
      assert.equal(
        (
          await client.query("SELECT validated_at FROM reports WHERE id=$1", [
            pendingId,
          ])
        ).rows[0].validated_at,
        null,
      );
      await client.query("SAVEPOINT invalid_validation");
      await assert.rejects(
        client.query("UPDATE reports SET status='validated' WHERE id=$1", [
          pendingId,
        ]),
      );
      await client.query("ROLLBACK TO SAVEPOINT invalid_validation");
      await client.query(
        await readFile("db/migrations/004_report_adjustments.sql", "utf8"),
      );
      const preserved = (
        await client.query(
          "SELECT status,validation_source,validated_by,description FROM reports WHERE id=$1",
          [reportId],
        )
      ).rows[0];
      assert.equal(preserved.status, "published");
      assert.equal(preserved.validation_source, "legacy_publication");
      assert.equal(preserved.validated_by, userId);
      assert.equal(preserved.description, row.description);
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM report_adjustments",
          )
        ).rows[0].total,
        0,
      );
      await client.query("SAVEPOINT anonymous_adjustments");
      await assert.rejects(
        client.query(
          "UPDATE reports SET status='needs_adjustments' WHERE id=$1",
          [pendingId],
        ),
      );
      await client.query("ROLLBACK TO SAVEPOINT anonymous_adjustments");
      await client.query("UPDATE reports SET author_id=$1 WHERE id=$2", [
        userId,
        pendingId,
      ]);
      await client.query(
        "UPDATE reports SET status='needs_adjustments' WHERE id=$1",
        [pendingId],
      );
      await client.query(
        "INSERT INTO report_adjustments(id,report_id,note,requested_by) VALUES($1,$2,$3,$4)",
        [
          randomUUID(),
          pendingId,
          "Una observación ficticia que debe conservarse.",
          userId,
        ],
      );
      await client.query("SAVEPOINT duplicate_request");
      await assert.rejects(
        client.query(
          "INSERT INTO report_adjustments(id,report_id,note,requested_by) VALUES($1,$2,$3,$4)",
          [
            randomUUID(),
            pendingId,
            "Otra observación que no debe duplicar la solicitud.",
            userId,
          ],
        ),
      );
      await client.query("ROLLBACK TO SAVEPOINT duplicate_request");
      await client.query(
        await readFile("db/migrations/005_private_evidence.sql", "utf8"),
      );
      assert.equal(
        (
          await client.query("SELECT source_url FROM reports WHERE id=$1", [
            reportId,
          ])
        ).rows[0].source_url,
        null,
      );
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM report_evidence",
          )
        ).rows[0].total,
        0,
      );
      await client.query(
        await readFile("db/migrations/006_intake_analysis.sql", "utf8"),
      );
      await client.query(
        await readFile("db/migrations/007_private_followup.sql", "utf8"),
      );
      await client.query(
        await readFile("db/migrations/008_alert_drafts.sql", "utf8"),
      );
      await client.query(
        await readFile("db/migrations/009_alert_generations.sql", "utf8"),
      );
      await client.query(
        "INSERT INTO intake_analyses(id,report_id,report_version,synthetic_confirmed,state) VALUES($1,$2,1,true,'queued')",
        [randomUUID(), pendingId],
      );
      await client.query(
        await readFile("db/migrations/010_intake_consent.sql", "utf8"),
      );
      const historical = (await client.query(
        "SELECT synthetic_confirmed,ai_consent,consent_version,consented_at FROM intake_analyses WHERE report_id=$1", [pendingId],
      )).rows[0];
      assert.equal(historical.synthetic_confirmed, true);
      assert.equal(historical.ai_consent, false);
      assert.equal(historical.consent_version, null);
      assert.equal(historical.consented_at, null);
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM alert_generations",
          )
        ).rows[0].total,
        0,
      );
      assert.equal(
        (await client.query("SELECT count(*)::int AS total FROM alert_drafts"))
          .rows[0].total,
        0,
      );
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM report_followup_events",
          )
        ).rows[0].total,
        0,
      );
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM intake_analyses WHERE ai_consent",
          )
        ).rows[0].total,
        0,
      );
      assert.deepEqual(
        (
          await client.query(
            "SELECT reviewed_categories FROM reports WHERE id=$1",
            [reportId],
          )
        ).rows[0].reviewed_categories,
        [],
      );
      assert.equal(
        (
          await client.query("SELECT id FROM publications WHERE report_id=$1", [
            reportId,
          ])
        ).rows[0].id,
        publicationId,
      );
    } finally {
      await client.query("ROLLBACK");
      client.release();
      await db.end();
    }
  },
);
