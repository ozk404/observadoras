import { cookies } from "next/headers";
import { db } from "@/server/db";
import { cookieOptions, sessionCookie } from "@/server/auth";
import { apiError, checkOrigin, digest } from "@/server/security";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const jar = await cookies();
    const token = jar.get(sessionCookie)?.value;
    if (token)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(token),
      ]);
    jar.set(sessionCookie, "", { ...cookieOptions(), maxAge: 0 });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
