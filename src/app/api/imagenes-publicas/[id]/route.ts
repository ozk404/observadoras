import { z } from "zod";
import { db } from "@/server/db";
import { evidenceThumbnail } from "@/server/evidence-thumbnail";
let active = 0;
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (active >= 16)
    return new Response(null, {
      status: 429,
      headers: { ...headers, "Retry-After": "1" },
    });
  active++;
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success)
      return new Response(null, { status: 404, headers });
    const row = (
      await db.query<{ content: Buffer }>(
        "SELECT i.content FROM publication_images i JOIN publications p ON p.id=i.publication_id WHERE i.asset_id=$1 AND p.withdrawn_at IS NULL",
        [id],
      )
    ).rows[0];
    if (!row) return new Response(null, { status: 404, headers });
    const content =
      new URL(request.url).searchParams.get("vista") === "miniatura"
        ? await evidenceThumbnail(row.content)
        : row.content;
    return new Response(new Uint8Array(content), {
      headers: {
        ...headers,
        "Content-Type": "image/webp",
        "Content-Disposition": 'inline; filename="imagen-publica.webp"',
      },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  } finally {
    active--;
  }
}
