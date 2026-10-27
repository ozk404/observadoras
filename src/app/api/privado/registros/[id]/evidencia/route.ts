import { requireUser } from "@/server/auth";
import { getReport } from "@/server/reports";
import { db } from "@/server/db";
import { evidenceThumbnail } from "@/server/evidence-thumbnail";
import { apiError, HttpError } from "@/server/security";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await getReport(user, id);
    const row = (
      await db.query<{ content: Buffer }>(
        "SELECT content FROM report_evidence WHERE report_id=$1",
        [id],
      )
    ).rows[0];
    if (!row) throw new HttpError(404, "No hay imagen para este reporte.");
    const thumbnail =
      new URL(request.url).searchParams.get("vista") === "miniatura";
    const content = thumbnail
      ? await evidenceThumbnail(row.content)
      : row.content;
    return new Response(new Uint8Array(content), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": 'inline; filename="evidencia.webp"',
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
