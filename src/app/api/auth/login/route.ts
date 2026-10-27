import { z } from "zod";
import { db } from "@/server/db";
import { createSession } from "@/server/auth";
import { verifyPassword } from "@/server/password";
import {
  apiError,
  checkOrigin,
  digest,
  HttpError,
  limit,
  networkKey,
  readJson,
} from "@/server/security";
const credentials = z
  .object({
    username: z.string().trim().toLowerCase().min(3).max(64),
    password: z.string().min(1).max(128),
  })
  .strict();
const dummyHash = `${"0".repeat(32)}:${"0".repeat(128)}`;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await limit(`login:${networkKey(request)}`, 60, 900);
    const data = credentials.parse(await readJson(request));
    await limit(`account:${digest(data.username)}`, 10, 900);
    const result = await db.query(
      "SELECT id,password_hash,enabled FROM users WHERE username=$1",
      [data.username],
    );
    const user = result.rows[0];
    const valid = await verifyPassword(
      data.password,
      user?.password_hash ?? dummyHash,
    );
    if (!valid || !user?.enabled)
      throw new HttpError(
        401,
        "No pudimos iniciar sesión. Revisa tus credenciales o consulta con la administración.",
      );
    await createSession(user.id, user.password_hash);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
