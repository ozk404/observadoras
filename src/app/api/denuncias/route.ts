import { publicSubmission, createReport } from "@/server/reports";
import {
  apiError,
  checkOrigin,
  limit,
  networkKey,
  readJson,
  verifyFormToken,
} from "@/server/security";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await limit("public:global", 120, 600);
    await limit(`public:${networkKey(request)}`, 30, 600);
    const data = publicSubmission.parse(await readJson(request));
    verifyFormToken(data.token);
    await limit(`form:${data.token.split(".")[0]}`, 3, 3600);
    await createReport(
      data.title,
      data.description,
      null,
      true,
      data.submissionKey,
    );
    return Response.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
