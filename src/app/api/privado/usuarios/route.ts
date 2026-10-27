import { requireUser } from "@/server/auth";
import { listUsers, createManagedUser } from "@/server/users";
import { apiError, checkOrigin, readJson } from "@/server/security";
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const page = Math.min(
      10000,
      Math.max(1, parseInt(query.get("pagina") ?? "1") || 1),
    );
    return Response.json(
      await listUsers(await requireUser(), page, query.get("buscar") ?? ""),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    return Response.json(
      await createManagedUser(await requireUser(), await readJson(request)),
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
