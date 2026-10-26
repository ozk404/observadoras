import { publicSubmission, createReport } from "@/server/reports";
import {
  apiError,
  checkOrigin,
  limit,
  networkKey,
  verifyFormToken,
} from "@/server/security";
import { HttpError } from "@/server/security";
import { normalizeEvidence, readEvidenceForm } from "@/server/evidence";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await limit("public:global", 120, 600);
    await limit(`public:${networkKey(request)}`, 30, 600);
    const form = await readEvidenceForm(request);
    const data = publicSubmission.parse({
      description: form.get("description"),
      sourceUrl: form.get("sourceUrl") ?? "",
      consent: form.get("consent") === "true",
      website: form.get("website"),
      token: form.get("token"),
      submissionKey: form.get("submissionKey"),
    });
    verifyFormToken(data.token);
    await limit(`form:${data.token.split(".")[0]}`, 3, 3600);
    const file = form.get("evidence");
    if (!(file instanceof File))
      throw new HttpError(400, "Adjunta una captura o imagen.");
    const evidence = await normalizeEvidence(file);
    await createReport(
      `Reporte recibido · ${data.submissionKey.slice(0, 8)}`,
      data.description,
      null,
      true,
      data.submissionKey,
      {
        sourceUrl: data.sourceUrl,
        evidence,
        aiConsent: data.consent,
      },
    );
    return Response.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
