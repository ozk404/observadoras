import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { operateUser, fullName } from "../src/server/users";
import { hashPassword } from "../src/server/password";
// Password arrives on stdin, never as a command-line argument or log output.
const [operation, username, role, name] = process.argv.slice(2);
try {
  if (!/^[a-z0-9._-]{3,64}$/.test(username ?? ""))
    throw new Error(
      "Use a username of 3–64 lowercase letters, numbers, dots, hyphens or underscores.",
    );
  if (operation === "reset-password") {
    let password = "";
    for await (const part of process.stdin) password += part;
    await operateUser(username, "reset-password", password.trim());
  } else if (["disable", "grant-admin", "set-name"].includes(operation)) {
    await operateUser(
      username,
      operation as "disable" | "grant-admin" | "set-name",
      role,
    );
  } else if (
    operation === "create" &&
    ["participant", "reviewer"].includes(role)
  ) {
    const parsedName = fullName.parse(name);
    let password = "";
    for await (const part of process.stdin) password += part;
    password = password.trim();
    if (password.length < 14 || password.length > 128)
      throw new Error("Password must have 14–128 characters.");
    const userId = randomUUID();
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO users(id,username,password_hash,role,full_name) VALUES($1,$2,$3,$4,$5)",
        [userId, username, await hashPassword(password), role, parsedName],
      );
      await client.query(
        "INSERT INTO user_events(id,target_id,action,origin,changed_fields) VALUES($1,$2,'created','operational',$3)",
        [randomUUID(), userId, ["username", "full_name", "role"]],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } else
    throw new Error(
      "Usage: npm run user -- create USER participant|reviewer FULL_NAME (password on stdin), disable USER, grant-admin USER, set-name USER FULL_NAME, reset-password USER (password on stdin)",
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
