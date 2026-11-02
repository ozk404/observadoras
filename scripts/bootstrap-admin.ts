import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { hashPassword } from "../src/server/password";

const client = await db.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(841028)");
  const existing = await client.query("SELECT id,enabled,can_manage_users FROM users WHERE username='admin' FOR UPDATE");
  if (existing.rowCount) {
    if (!existing.rows[0].enabled || !existing.rows[0].can_manage_users)
      throw new Error("Existing admin requires explicit account recovery; credentials were preserved.");
    console.log("Existing administrator preserved.");
  } else {
    const id = randomUUID();
    await client.query("INSERT INTO users(id,username,full_name,password_hash,role,enabled,can_manage_users) VALUES($1,'admin','Administrador',$2,'reviewer',true,true)", [id, await hashPassword("admin")]);
    await client.query("INSERT INTO user_events(id,target_id,action,origin,changed_fields) VALUES($1,$2,'created','operational',$3)", [randomUUID(), id, ["username", "full_name", "role", "can_manage_users"]]);
    console.log("Initial administrator created.");
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error instanceof Error && !("code" in error) ? error.message : "Administrator initialization failed; private details omitted.");
  process.exitCode = 1;
} finally {
  client.release();
  await db.end();
}
