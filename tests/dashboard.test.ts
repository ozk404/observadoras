import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { parseDashboardFilters } from "../src/lib/dashboard";
import { getDashboard } from "../src/server/dashboard";
import { db } from "../src/server/db";
import { HttpError } from "../src/server/security";
test("dashboard filters reject unknown, repeated and invalid values", () => {
  assert.deepEqual(parseDashboardFilters(new URLSearchParams()), {
    periodo: "30",
    agrupar: "clasificacion",
  });
  for (const query of [
    "periodo=0",
    "periodo=30&periodo=90",
    "agrupar=estado&agrupar=estado",
    "autor=private",
    "periodo=30%27",
    "__proto__=x",
    "agrupar=riesgo",
  ])
    assert.throws(() => parseDashboardFilters(new URLSearchParams(query)));
});
test(
  "dashboard aggregates only validated human data in one snapshot with strict date boundaries and reviewer access",
  { skip: process.env.TEST_DATABASE_MIGRATIONS !== "true" },
  async () => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const schema = `dashboard_test_${randomUUID().replaceAll("-", "")}`;
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET LOCAL search_path TO ${schema}`);
      for (const name of (await readdir("db/migrations"))
        .filter((n) => n.endsWith(".sql"))
        .sort())
        await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      const user = {
        id: randomUUID(),
        username: "fixture-reviewer",
        role: "reviewer" as const,
      };
      const disabled = { ...user, id: randomUUID() };
      await client.query(
        "INSERT INTO users(id,username,password_hash,role,enabled) VALUES($1,'fixture-reviewer','not-a-login-hash','reviewer',true),($2,'fixture-disabled','not-a-login-hash','reviewer',false)",
        [user.id, disabled.id],
      );
      const fixtureId = randomUUID();
      await client.query(
        `INSERT INTO reports(id,title,description,status,author_id,validated_by,validated_at,validation_source,reviewed_categories,created_at) VALUES
      ($1,'Private fixture marker','Private text never returned by aggregates.','validated',NULL,$2,now()-interval '1 day','explicit',ARRAY['acoso','acoso','amenaza'],now()-interval '400 days'),
      ($3,'Fixture published','A fictional private original remains excluded.','published',NULL,$2,now()-interval '30 days','explicit','{}',now()),
      ($4,'Fixture just outside','Fictional description not in response.','validated',NULL,$2,now()-interval '30 days 0.000001 second','explicit',ARRAY['desinformacion'],now()),
      ($5,'Fixture pending','Fictional pending description excluded.','pending',$2,NULL,NULL,NULL,ARRAY['acoso'],now()),
      ($6,'Fixture draft','Fictional draft description excluded.','draft',$2,NULL,NULL,NULL,ARRAY['acoso'],now()),
      ($7,'Fixture adjustments','Fictional adjustment description excluded.','needs_adjustments',$2,NULL,NULL,NULL,ARRAY['acoso'],now()),
      ($8,'Fixture future','Fictional future validation excluded.','validated',NULL,$2,now()+interval '0.000001 second','explicit',ARRAY['barrera'],now()),
      ($9,'Fixture earlier','Fictional earlier validation without known categories.','validated',NULL,$2,now()-interval '90 days'+interval '1 second','explicit',ARRAY['unknown_fixture_category'],now())`,
        [fixtureId, user.id, ...Array.from({ length: 7 }, () => randomUUID())],
      );
      await client.query(
        "INSERT INTO ai_analyses(id,report_id,report_version,input_hash,model,transport,status,result,requested_by) VALUES($1,$2,1,'fixture','fixture','simulation','succeeded',$3,$4)",
        [
          randomUUID(),
          fixtureId,
          JSON.stringify({
            categories: ["doxing"],
            summary: "Fictional AI classification must not count.",
            limitations: "Fixture.",
          }),
          user.id,
        ],
      );
      const filters = parseDashboardFilters(new URLSearchParams());
      const result = await getDashboard(user, filters, client);
      assert.equal(result.total, 2);
      assert.deepEqual(
        result.rows.map((r) => [r.key, r.count, r.percentage]),
        [
          ["acoso", 1, 50],
          ["amenaza", 1, 50],
          ["sin_clasificar", 1, 50],
        ],
      );
      assert.equal(JSON.stringify(result).includes("Private"), false);
      assert.equal(JSON.stringify(result).includes(fixtureId), false);
      assert.equal(JSON.stringify(result).includes("doxing"), false);
      assert.deepEqual(
        (
          await getDashboard(user, { ...filters, agrupar: "estado" }, client)
        ).rows.map((r) => [r.key, r.count]),
        [
          ["published", 1],
          ["validated", 1],
        ],
      );
      for (const periodo of ["90", "365", "todo"] as const)
        assert.equal(
          (await getDashboard(user, { ...filters, periodo }, client)).total,
          4,
        );
      await assert.rejects(
        getDashboard({ ...user, role: "participant" }, filters, client),
        (e) => e instanceof HttpError && e.status === 403,
      );
      await assert.rejects(
        getDashboard(disabled, filters, client),
        (e) => e instanceof HttpError && e.status === 403,
      );
      await client.query(
        "UPDATE reports SET validated_at=now()-interval '400 days' WHERE status IN ('validated','published')",
      );
      assert.deepEqual(await getDashboard(user, filters, client), {
        total: 0,
        rows: [],
      });
    } finally {
      await client.query("ROLLBACK");
      client.release();
      await db.end();
    }
  },
);
