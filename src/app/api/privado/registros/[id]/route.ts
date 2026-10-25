import { requireUser } from "@/server/auth";
import { draftInput, getReport, saveDraft } from "@/server/reports";
import { apiError, checkOrigin, readJson } from "@/server/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(
      await getReport(await requireUser(), (await context.params).id),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    await getReport(user, id);
    return Response.json(
      await saveDraft(user, id, draftInput.parse(await readJson(request))),
    );
  } catch (error) {
    return apiError(error);
  }
}
