import { runIntakeOnce } from "../src/server/intake";
import { db } from "../src/server/db";
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
console.log(
  "Intake analysis worker started. Report content and credentials are never logged.",
);
try {
  while (!stopping) {
    try {
      await runIntakeOnce();
    } catch {
      console.error("Intake worker operation failed; private details omitted.");
    }
    if (!stopping) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
} finally {
  await db.end();
}
