import { requireUser } from "@/server/auth";
import { getReport, publishReport } from "@/server/reports";
import { apiError, checkOrigin, readJson, HttpError } from "@/server/security";
import { readEvidenceForm, normalizeEvidence } from "@/server/evidence";
import { imageApproval, type ApprovedImage } from "@/server/publication-images";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const user = await requireUser(true);
    const { id } = await context.params;
    const report = await getReport(user, id);
    let input: unknown;
    let image: ApprovedImage | undefined;
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data;")
    ) {
      if (report.status !== "validated")
        throw new HttpError(
          409,
          "Valida primero el reporte antes de preparar la publicación.",
        );
      const form = await readEvidenceForm(request, [
        "title",
        "body",
        "privacyConfirmed",
        "publicationConfirmed",
        "version",
        "image",
        "imageDescription",
        "imageConfirmed",
      ]);
      const approval = imageApproval.parse({
        description: form.get("imageDescription"),
        confirmed: form.get("imageConfirmed") === "true",
      });
      const file = form.get("image");
      if (!(file instanceof File))
        throw new HttpError(
          400,
          "Selecciona la copia pública que quieres publicar.",
        );
      input = {
        title: form.get("title"),
        body: form.get("body"),
        privacyConfirmed: form.get("privacyConfirmed") === "true",
        publicationConfirmed: form.get("publicationConfirmed") === "true",
        version: Number(form.get("version")),
      };
      image = { ...approval, evidence: await normalizeEvidence(file) };
    } else input = await readJson(request);
    return Response.json(
      { id: await publishReport(user, id, input, image) },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
