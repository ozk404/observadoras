import { formToken } from "@/server/security";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    { token: formToken() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
