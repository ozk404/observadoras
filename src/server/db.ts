import { Pool } from "pg";
import { databaseUrl } from "./database-config";
const globalDb = globalThis as unknown as { pool?: Pool };
export const db =
  globalDb.pool ??
  new Pool({ connectionString: databaseUrl(process.env.DATABASE_URL, process.env.DATABASE_HOST), max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.pool = db;
