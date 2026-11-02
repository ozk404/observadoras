import test from "node:test";
import assert from "node:assert/strict";
import { databaseUrl } from "../src/server/database-config";

test("proxy network cannot redirect the database through a shared db alias", () => {
  const original = new URL("postgresql://example:p%40ss%3Aword@db:9999/monitor?sslmode=require");
  const result = new URL(databaseUrl(original.href, "observadoras-db-1")!);
  assert.equal(result.hostname, "observadoras-db-1");
  assert.equal(result.port, "5432");
  assert.equal(result.username, original.username);
  assert.equal(result.password, original.password);
  assert.equal(result.pathname, original.pathname);
  assert.equal(result.search, original.search);
});
test("non-Compose runtimes retain their configured database endpoint", () => {
  const url = "postgresql://example:example@localhost:5555/test";
  assert.equal(databaseUrl(url), url);
});
test("an explicit Compose host does not silently use default credentials", () => {
  assert.throws(() => databaseUrl(undefined, "observadoras-db-1"), /DATABASE_URL/);
});
