import { requireUser } from "@/server/auth";
import { getIntake, retryIntake } from "@/server/intake";
import { apiError, checkOrigin, readJson } from "@/server/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return Response.json(
      await getIntake(await requireUser(true), (await context.params).id),
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
      await retryIntake(
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
