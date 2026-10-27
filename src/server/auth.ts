import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { digest, HttpError } from "./security";
export type User = {
  id: string;
  username: string;
  role: "participant" | "reviewer";
  full_name?: string | null;
  can_manage_users?: boolean;
};
export const sessionCookie = "od_session";
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 28800,
});
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await db.query(
    `SELECT u.id,u.username,u.role,u.full_name,u.can_manage_users FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.enabled=true`,
    [digest(token)],
  );
  return result.rows[0] ?? null;
}
export async function requireUser(reviewer = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Inicia sesión para continuar.");
  if (reviewer && user.role !== "reviewer")
    throw new HttpError(
      403,
      "No tienes permiso para revisar o publicar reportes.",
    );
  return user;
}
export async function createSession(userId: string, expectedHash: string) {
  const token = randomBytes(32).toString("hex");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const user = (
      await client.query(
        "SELECT enabled,password_hash FROM users WHERE id=$1 FOR UPDATE",
        [userId],
      )
    ).rows[0];
    if (!user?.enabled || user.password_hash !== expectedHash)
      throw new HttpError(
        401,
        "Las credenciales cambiaron. Inicia sesión de nuevo.",
      );
    await client.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
      [digest(token), userId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  (await cookies()).set(sessionCookie, token, cookieOptions());
}
