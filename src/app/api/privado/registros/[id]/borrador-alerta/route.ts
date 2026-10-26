import { requireUser } from "@/server/auth";
import { getAlertContext, saveAlertDraft } from "@/server/alert-drafts";
import { apiError, checkOrigin, readJson } from "@/server/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(
      await getAlertContext(await requireUser(true), (await context.params).id),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    return Response.json(
      await saveAlertDraft(
        await requireUser(true),
        (await context.params).id,
        await readJson(request),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
