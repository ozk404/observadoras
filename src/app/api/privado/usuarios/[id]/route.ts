import { requireUser } from "@/server/auth";
import { updateManagedUser } from "@/server/users";
import { apiError, checkOrigin, readJson } from "@/server/security";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    return Response.json(
      await updateManagedUser(
        await requireUser(),
        (await context.params).id,
        await readJson(request),
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
