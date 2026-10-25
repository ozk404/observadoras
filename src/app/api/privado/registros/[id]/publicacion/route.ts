import { requireUser } from "@/server/auth";
import { getReport, publishReport } from "@/server/reports";
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
      { id: await publishReport(user, id, await readJson(request)) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
