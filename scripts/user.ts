import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { hashPassword } from "../src/server/password";
// Password arrives on stdin, never as a command-line argument or log output.
const [operation, username, role] = process.argv.slice(2);
try {
  if (!/^[a-z0-9._-]{3,64}$/.test(username ?? ""))
    throw new Error(
      "Use a username of 3–64 lowercase letters, numbers, dots, hyphens or underscores.",
    );
  if (operation === "disable") {
    const result = await db.query(
      "UPDATE users SET enabled=false WHERE username=$1 RETURNING id",
      [username],
    );
    if (!result.rowCount) throw new Error("Account not found.");
    await db.query("DELETE FROM sessions WHERE user_id=$1", [
      result.rows[0].id,
    ]);
  } else if (
    operation === "create" &&
    ["participant", "reviewer"].includes(role)
  ) {
    let password = "";
    for await (const part of process.stdin) password += part;
    password = password.trim();
    if (password.length < 14 || password.length > 128)
      throw new Error("Password must have 14–128 characters.");
    await db.query(
      "INSERT INTO users(id,username,password_hash,role) VALUES($1,$2,$3,$4)",
      [randomUUID(), username, await hashPassword(password), role],
    );
  } else
    throw new Error(
      "Usage: npm run user -- create USER participant|reviewer (password on stdin), or disable USER",
    );
  console.log("Account operation completed.");
} catch (error) {
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "Account operation failed. Check username and database.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
