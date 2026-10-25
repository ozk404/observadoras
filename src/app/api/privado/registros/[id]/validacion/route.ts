import { requireUser } from "@/server/auth";
import { getReport, validateReport } from "@/server/reports";
import { apiError, checkOrigin, readJson } from "@/server/security";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const user = await requireUser(true);
    const { id } = await context.params;
    await getReport(user, id);
    return Response.json(
      await validateReport(user, id, await readJson(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
