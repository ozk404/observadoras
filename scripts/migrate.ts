import { readdir, readFile } from "node:fs/promises";
import { db } from "../src/server/db";
const client = await db.connect();
try {
  await client.query("SELECT pg_advisory_lock(841027)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
  );
  for (const name of (await readdir("db/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      (await client.query("SELECT 1 FROM migrations WHERE name=$1", [name]))
        .rowCount
    )
      continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      await client.query("INSERT INTO migrations(name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(841027)");
  client.release();
  await db.end();
}
