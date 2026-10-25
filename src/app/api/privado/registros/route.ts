import { requireUser } from "@/server/auth";
import { createReport, draftInput, reportFields } from "@/server/reports";
import { apiError, checkOrigin, readJson } from "@/server/security";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const data = draftInput.parse(await readJson(request));
    if (data.submit) reportFields.parse(data);
    const id = await createReport(
      data.title,
      data.description,
      user.id,
      data.submit,
    );
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
