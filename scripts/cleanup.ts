import { db } from "../src/server/db";
try {
  await db.query("DELETE FROM sessions WHERE expires_at<now()");
  await db.query("DELETE FROM rate_limits WHERE expires_at<now()");
  console.log("Expired technical records removed. Reports were not changed.");
} finally {
  await db.end();
}
