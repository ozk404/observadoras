import { requireUser } from "@/server/auth";
import { getDashboard } from "@/server/dashboard";
import { parseDashboardFilters } from "@/lib/dashboard";
import { apiError } from "@/server/security";
export async function GET(request: Request) {
  try {
    const user = await requireUser(true);
    return Response.json(
      await getDashboard(
        user,
        parseDashboardFilters(new URL(request.url).searchParams),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
