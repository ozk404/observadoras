import { z } from "zod";
import { requireUser } from "@/server/auth";
import { getReport } from "@/server/reports";
import { apiError, checkOrigin, readJson, HttpError } from "@/server/security";
import { readEvidenceForm, normalizeEvidence } from "@/server/evidence";
import {
  imageApproval,
  changePublicationImage,
  publicImageContext,
} from "@/server/publication-images";
type Context = { params: Promise<{ id: string }> };
const reply = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function failure(error: unknown) {
  const response = apiError(error);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser(true);
    const { id } = await context.params;
    await getReport(user, id);
    return reply(await publicImageContext(id));
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireUser(true);
    const { id } = await context.params;
    const report = await getReport(user, id);
    if (report.status !== "published")
      throw new HttpError(
        409,
        "Publica primero la versión revisada del reporte.",
      );
    const form = await readEvidenceForm(request, [
      "version",
      "image",
      "description",
      "confirmed",
    ]);
    const version = z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().nonnegative())
      .parse(form.get("version"));
    const approval = imageApproval.parse({
      description: form.get("description"),
      confirmed: form.get("confirmed") === "true",
    });
    const file = form.get("image");
    if (!(file instanceof File))
      throw new HttpError(400, "Selecciona una copia pública.");
    return reply(
      await changePublicationImage(user, id, version, {
        ...approval,
        evidence: await normalizeEvidence(file),
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireUser(true);
    const { id } = await context.params;
    await getReport(user, id);
    const data = z
      .object({
        version: z.number().int().nonnegative(),
        confirmed: z.literal(true),
      })
      .strict()
      .parse(await readJson(request));
    return reply(await changePublicationImage(user, id, data.version, null));
  } catch (error) {
    return failure(error);
  }
}
