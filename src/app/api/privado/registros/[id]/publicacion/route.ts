import { requireUser } from "@/server/auth";
import { getReport, publishReport } from "@/server/reports";
import { apiError, checkOrigin, readJson, HttpError } from "@/server/security";
import { readEvidenceForm, normalizeEvidence } from "@/server/evidence";
import {
  originalPublicationEvidence,
  imageApproval,
  type ApprovedImage,
} from "@/server/publication-images";
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
        "categories",
        "summary",
        "context",
        "findings",
        "analysis",
        "limitations",
        "privacyConfirmed",
        "publicationConfirmed",
        "version",
        "image",
        "imageSource",
        "imageDescription",
        "imageConfirmed",
      ]);
      const approval = imageApproval.parse({
        description: form.get("imageDescription"),
        confirmed: form.get("imageConfirmed") === "true",
      });
      const source = form.get("imageSource");
      const file = form.get("image");
      if (source !== null && source !== "original" && source !== "upload")
        throw new HttpError(400, "Selecciona una imagen válida.");
      if (source === "original" && file !== null)
        throw new HttpError(400, "Selecciona solo una fuente de imagen.");
      if (source !== "original" && !(file instanceof File))
        throw new HttpError(400, "Selecciona una imagen pública.");
      input = {
        title: form.get("title"),
        body: form.get("body"),
        categories: parseCategories(form.get("categories")),
        ...Object.fromEntries(
          ["summary", "context", "findings", "analysis", "limitations"].map(
            (key) => [key, form.get(key) ?? ""],
          ),
        ),
        privacyConfirmed: form.get("privacyConfirmed") === "true",
        publicationConfirmed: form.get("publicationConfirmed") === "true",
        version: Number(form.get("version")),
      };
      image = {
        ...approval,
        evidence:
          source === "original"
            ? await originalPublicationEvidence(id)
            : await normalizeEvidence(file as File),
      };
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

function parseCategories(value: FormDataEntryValue | null) {
  if (value === null) return [];
  try {
    return JSON.parse(String(value));
  } catch {
    throw new HttpError(
      400,
      "Las categorías públicas no tienen un formato válido.",
    );
  }
}
