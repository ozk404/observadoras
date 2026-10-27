import { requireUser } from "@/server/auth";
import { userHistory } from "@/server/users";
import { apiError } from "@/server/security";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return Response.json(
      await userHistory(await requireUser(), (await context.params).id),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
