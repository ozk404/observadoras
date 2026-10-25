import { requireUser } from "@/server/auth";
import {
  getReport,
  listAdjustments,
  requestAdjustments,
} from "@/server/reports";
import { apiError, checkOrigin, readJson } from "@/server/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(
      await listAdjustments(await requireUser(), (await context.params).id),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireUser(true);
    const { id } = await context.params;
    await getReport(user, id);
    return Response.json(
      await requestAdjustments(user, id, await readJson(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
