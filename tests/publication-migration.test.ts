import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { db } from "../src/server/db";

test("publication management migration preserves existing approvals and only archives their public copy", {skip:process.env.TEST_DATABASE_MIGRATIONS!=="true"},async()=>{
  const client=await db.connect();
  try {
    await client.query("BEGIN");
    const schema=`publication_migration_${randomUUID().replaceAll("-","")}`;
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET LOCAL search_path TO ${schema}`);
    for(const name of (await readdir("db/migrations")).filter(n=>n.endsWith(".sql")&&n<"014_").sort()) await client.query(await readFile(`db/migrations/${name}`,"utf8"));
    const actor=randomUUID(),report=randomUUID(),publication=randomUUID();
    await client.query("INSERT INTO users(id,username,password_hash,role) VALUES($1,'fixture-reviewer','not-a-login-hash','reviewer')",[actor]);
    await client.query("INSERT INTO reports(id,title,description,status,validated_by,validated_at,validation_source) VALUES($1,'Original ficticio','Contenido privado que no debe archivarse como publicación.','published',$2,'2026-01-01','explicit')",[report,actor]);
    await client.query("INSERT INTO publications(id,report_id,title,body,published_by,published_at,summary) VALUES($1,$2,'Título público ficticio','Contenido público previamente aprobado y verificable.',$3,'2026-01-02T12:00:00Z','Resumen público ficticio')",[publication,report,actor]);
    await client.query(await readFile("db/migrations/014_publication_management.sql","utf8"));
    const p=(await client.query("SELECT * FROM publications WHERE id=$1",[publication])).rows[0];
    assert.equal(p.version,1);assert.equal(p.withdrawn_at,null);assert.equal(p.published_at.toISOString(),"2026-01-02T12:00:00.000Z");
    const event=(await client.query("SELECT * FROM publication_events WHERE publication_id=$1",[publication])).rows[0];
    assert.equal(event.actor_id,actor);assert.equal(event.action,"published");assert.equal(event.created_at.toISOString(),p.published_at.toISOString());
    assert.equal(event.snapshot.body,p.body);assert.equal(event.snapshot.summary,p.summary);assert.ok(!JSON.stringify(event.snapshot).includes("Contenido privado"));
  } finally {
    await client.query("ROLLBACK");client.release();await db.end();
  }
});
