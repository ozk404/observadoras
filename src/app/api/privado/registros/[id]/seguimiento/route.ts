import { requireUser } from "@/server/auth";
import { listFollowup, writeFollowup } from "@/server/followup";
import { apiError, checkOrigin, readJson } from "@/server/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(
      await listFollowup(await requireUser(true), (await context.params).id),
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
      await writeFollowup(
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
