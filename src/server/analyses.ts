import { randomUUID } from "node:crypto";
import {
  aiInputSchema,
  analysisErrorLabels,
  type AnalysisView,
} from "../lib/ai-contract";
import { sensitiveSignals } from "../lib/privacy";
import { db } from "./db";
import type { User } from "./auth";
import { getReport } from "./reports";
import { aiConfiguration, ProviderError, requestSuggestion } from "./openai";
import { digest, HttpError, limit } from "./security";
export async function listAnalyses(
  user: User,
  reportId: string,
): Promise<AnalysisView[]> {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "Solo el equipo revisor puede consultar sugerencias de IA.",
    );
  await getReport(user, reportId);
  const result = await db.query(
    `SELECT id,model,transport,status,result,error_code,created_at,superseded_at FROM ai_analyses WHERE report_id=$1 ORDER BY created_at DESC LIMIT 5`,
    [reportId],
  );
  return result.rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
    superseded_at: row.superseded_at?.toISOString() ?? null,
  }));
}
export async function generateAnalysis(
  user: User,
  reportId: string,
  input: unknown,
) {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "Solo el equipo revisor puede solicitar sugerencias.",
    );
  const report = await getReport(user, reportId);
  const data = aiInputSchema.parse(input);
  if (report.status !== "pending" || report.version !== data.version)
    throw new HttpError(
      409,
      "El registro cambió o su revisión ya terminó. Recarga antes de solicitar IA.",
    );
  const signals = sensitiveSignals(data.text);
  if (signals.length)
    throw new HttpError(
      400,
      `No se envió el texto. Revisa estas señales: ${signals.join(", ")}. Elimina referencias identificables y vuelve a revisar.`,
    );
  const config = aiConfiguration();
  if (!config.ready)
    throw new HttpError(
      503,
      "La IA no está configurada para pruebas ficticias. Puedes continuar manualmente.",
    );
  await limit(`ai:user:${user.id}`, 10, 3600);
  await limit("ai:global", 60, 3600);
  await db.query(
    `UPDATE ai_analyses SET status='failed',error_code='timeout',finished_at=now() WHERE report_id=$1 AND status='running' AND created_at<now()-interval '2 minutes'`,
    [reportId],
  );
  const id = randomUUID();
  const inserted = await db.query(
    `INSERT INTO ai_analyses(id,report_id,report_version,requested_by,input_hash,model,transport,status)
    SELECT $1,r.id,r.version,$2,$3,$4,$5,'running' FROM reports r JOIN users u ON u.id=$2
    WHERE r.id=$6 AND r.status='pending' AND r.version=$7 AND u.enabled AND u.role='reviewer'
    ON CONFLICT DO NOTHING RETURNING id`,
    [
      id,
      user.id,
      digest(data.text),
      config.model,
      config.simulation ? "simulation" : "openai",
      reportId,
      data.version,
    ],
  );
  if (!inserted.rowCount)
    throw new HttpError(
      409,
      "Hay un análisis en curso o el registro cambió. Espera y recarga antes de continuar.",
    );
  try {
    const result = await requestSuggestion(data.text, {
      model: config.model,
      apiKey: process.env.OPENAI_API_KEY!,
      endpoint: config.endpoint,
    });
    if (sensitiveSignals(`${result.summary}\n${result.limitations}`).length)
      throw new ProviderError("invalid_response");
    const saved = await db.query(
      `UPDATE ai_analyses a SET status='succeeded',result=$1,finished_at=now()
      WHERE a.id=$2 AND a.status='running' AND a.superseded_at IS NULL AND EXISTS(SELECT 1 FROM reports r WHERE r.id=a.report_id AND r.version=a.report_version AND r.status='pending')
      AND EXISTS(SELECT 1 FROM users u WHERE u.id=a.requested_by AND u.enabled AND u.role='reviewer') RETURNING id`,
      [JSON.stringify(result), id],
    );
    if (!saved.rowCount) {
      await db.query(
        `UPDATE ai_analyses SET status='failed',error_code='stale',finished_at=now() WHERE id=$1`,
        [id],
      );
      throw new HttpError(409, analysisErrorLabels.stale);
    }
    return { id, result, simulation: config.simulation };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const code = error instanceof ProviderError ? error.code : "unavailable";
    await db.query(
      `UPDATE ai_analyses SET status='failed',error_code=$1,finished_at=now() WHERE id=$2 AND status='running'`,
      [code, id],
    );
    throw new HttpError(502, analysisErrorLabels[code]);
  }
}
