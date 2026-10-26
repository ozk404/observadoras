import { randomUUID } from "node:crypto";
import type { User } from "./auth";
import { db } from "./db";
import { getReport } from "./reports";
import { digest, HttpError, limit } from "./security";
import {
  aiConfiguration,
  ProviderError,
  requestAlertSuggestion,
} from "./openai";
import { sensitiveSignals } from "../lib/privacy";
import {
  alertGenerationInput,
  type AlertGenerationView,
  type AlertSuggestion,
} from "../lib/alert-contract";
import { analysisErrorLabels } from "../lib/ai-contract";
export async function latestAlertGeneration(
  user: User,
  reportId: string,
): Promise<AlertGenerationView | null> {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "Solo las revisoras pueden consultar propuestas de alerta.",
    );
  const report = await getReport(user, reportId);
  if (!["validated", "published"].includes(report.status))
    throw new HttpError(409, "Primero valida el registro internamente.");
  const row = (
    await db.query(
      "SELECT id,report_version,draft_version,model,transport,status,result,error_code,created_at,finished_at FROM alert_generations WHERE report_id=$1 ORDER BY created_at DESC,id LIMIT 1",
      [reportId],
    )
  ).rows[0];
  return row
    ? {
        ...row,
        created_at: row.created_at.toISOString(),
        finished_at: row.finished_at?.toISOString() ?? null,
      }
    : null;
}
async function finish(
  id: string,
  user: User,
  reportId: string,
  reportVersion: number,
  draftVersion: number,
  result: AlertSuggestion,
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const report = (
      await client.query(
        "SELECT status,version FROM reports WHERE id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    const actor = await client.query(
      "SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
      [user.id],
    );
    const draft = (
      await client.query(
        "SELECT version FROM alert_drafts WHERE report_id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    const job = (
      await client.query(
        "SELECT status,created_at>now()-interval '2 minutes' AS live FROM alert_generations WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    const valid =
      !!report &&
      ["validated", "published"].includes(report.status) &&
      report.version === reportVersion &&
      (draft?.version ?? 0) === draftVersion &&
      !!actor.rowCount &&
      job?.status === "running" &&
      !!job.live;
    if (job?.status === "running")
      await client.query(
        "UPDATE alert_generations SET status=$2,result=$3,error_code=$4,finished_at=now() WHERE id=$1",
        [
          id,
          valid ? "succeeded" : "failed",
          valid ? JSON.stringify(result) : null,
          valid ? null : job.live ? "stale" : "timeout",
        ],
      );
    await client.query("COMMIT");
    return valid;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function generateAlert(
  user: User,
  reportId: string,
  input: unknown,
): Promise<AlertGenerationView> {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "Solo las revisoras pueden generar propuestas de alerta.",
    );
  const data = alertGenerationInput.parse(input);
  const report = await getReport(user, reportId);
  if (
    !["validated", "published"].includes(report.status) ||
    report.version !== data.reportVersion
  )
    throw new HttpError(409, "El registro cambió o todavía no está validado.");
  if (sensitiveSignals(data.text).length)
    throw new HttpError(
      400,
      "Revisa y elimina las referencias identificables del texto preparado. No se envió a OpenAI.",
    );
  const config = aiConfiguration();
  if (!config.ready)
    throw new HttpError(
      503,
      "La IA no está configurada para análisis autorizado. Puedes redactar manualmente.",
    );
  const expected = (
    await db.query("SELECT version FROM alert_drafts WHERE report_id=$1", [
      reportId,
    ])
  ).rows[0];
  if ((expected?.version ?? 0) !== data.draftVersion)
    throw new HttpError(
      409,
      "El borrador cambió. Conserva tu texto y recarga.",
    );
  await limit(`ai:user:${user.id}`, 10, 3600);
  await limit("ai:global", 60, 3600);
  const id = randomUUID();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const current = (
      await client.query(
        "SELECT status,version FROM reports WHERE id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    const actor = await client.query(
      "SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
      [user.id],
    );
    const draft = (
      await client.query(
        "SELECT version FROM alert_drafts WHERE report_id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    if (!actor.rowCount)
      throw new HttpError(
        403,
        "Tu cuenta no puede solicitar propuestas de alerta.",
      );
    if (
      !current ||
      !["validated", "published"].includes(current.status) ||
      current.version !== data.reportVersion ||
      (draft?.version ?? 0) !== data.draftVersion
    )
      throw new HttpError(
        409,
        "El registro o el borrador cambió. Conserva tu texto y recarga.",
      );
    await client.query(
      "UPDATE alert_generations SET status='failed',error_code='timeout',finished_at=now() WHERE report_id=$1 AND status='running' AND created_at<now()-interval '2 minutes'",
      [reportId],
    );
    const claimed = await client.query(
      "INSERT INTO alert_generations(id,report_id,report_version,draft_version,requested_by,input_hash,model,transport,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'running') ON CONFLICT DO NOTHING RETURNING id",
      [
        id,
        reportId,
        data.reportVersion,
        data.draftVersion,
        user.id,
        digest(data.text),
        config.model,
        config.simulation ? "simulation" : "openai",
      ],
    );
    if (!claimed.rowCount)
      throw new HttpError(
        409,
        "Hay una generación en curso. Espera antes de intentarlo otra vez.",
      );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  try {
    const result = await requestAlertSuggestion(data.text, {
      model: config.model,
      apiKey: process.env.OPENAI_API_KEY!,
      endpoint: config.endpoint,
    });
    if (
      sensitiveSignals(`${result.title}\n${result.body}\n${result.limitations}`)
        .length
    )
      throw new ProviderError("invalid_response");
    if (
      !(await finish(
        id,
        user,
        reportId,
        data.reportVersion,
        data.draftVersion,
        result,
      ))
    )
      throw new HttpError(
        409,
        "La propuesta dejó de estar vigente y se descartó. Conserva tu texto y recarga.",
      );
    const row = (
      await db.query(
        "SELECT id,report_version,draft_version,model,transport,status,result,error_code,created_at,finished_at FROM alert_generations WHERE id=$1",
        [id],
      )
    ).rows[0];
    return {
      ...row,
      created_at: row.created_at.toISOString(),
      finished_at: row.finished_at.toISOString(),
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const code = error instanceof ProviderError ? error.code : "unavailable";
    await db.query(
      "UPDATE alert_generations SET status='failed',error_code=$2,finished_at=now() WHERE id=$1 AND status='running'",
      [id, code],
    );
    throw new HttpError(502, analysisErrorLabels[code]);
  }
}
