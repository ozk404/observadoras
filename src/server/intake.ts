import { randomUUID } from "node:crypto";
import { db } from "./db";
import {
  aiConfiguration,
  ProviderError,
  requestIntakeSuggestion,
} from "./openai";
import { getReport } from "./reports";
import { HttpError, limit } from "./security";
import type { User } from "./auth";
import type { IntakeView, IntakeSuggestion } from "../lib/ai-contract";
import { z } from "zod";
import { AI_ANALYSIS_CONSENT_VERSIONS, permitsInitialAnalysis } from "../lib/consent";
export async function getIntake(
  user: User,
  reportId: string,
): Promise<IntakeView | null> {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "Solo el equipo revisor puede consultar el análisis inicial.",
    );
  await getReport(user, reportId);
  return (
    (
      await db.query(
        `SELECT id,report_version,state,attempts,result,error_code,model,transport,created_at,finished_at FROM intake_analyses WHERE report_id=$1`,
        [reportId],
      )
    ).rows[0] ?? null
  );
}
export async function retryIntake(
  user: User,
  reportId: string,
  input: unknown,
) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para reintentar el análisis.");
  const data = z
    .object({
      confirmed: z.literal(true),
      version: z.number().int().positive(),
    })
    .strict()
    .parse(input);
  const report = await getReport(user, reportId);
  if (report.status !== "pending" || report.version !== data.version)
    throw new HttpError(409, "El registro ya cambió o su revisión terminó.");
  const row = await db.query(
    `UPDATE intake_analyses a SET state='queued',attempts=0,available_at=now(),error_code=NULL,result=NULL,finished_at=NULL,last_retry_by=$2
    WHERE report_id=$1 AND ai_consent AND consent_version=ANY($4::text[]) AND consented_at IS NOT NULL AND state IN ('blocked','failed')
    AND EXISTS(SELECT 1 FROM reports r WHERE r.id=a.report_id AND r.status='pending' AND r.version=$3 AND r.version=a.report_version)
    AND EXISTS(SELECT 1 FROM users WHERE id=$2 AND enabled AND role='reviewer') RETURNING id`,
    [reportId, user.id, data.version, AI_ANALYSIS_CONSENT_VERSIONS],
  );
  if (!row.rowCount)
    throw new HttpError(
      409,
      "No hay un análisis fallido o bloqueado que pueda reintentarse.",
    );
  return { ok: true };
}
type Job = {
  id: string;
  report_id: string;
  report_version: number;
  ai_consent: boolean;
  consent_version: string | null;
  consented_at: Date | null;
  attempts: number;
  lease_token: string;
};
async function claimJob(): Promise<Job | null> {
  await db.query(
    `UPDATE intake_analyses SET state=CASE WHEN attempts>=2 THEN 'failed' ELSE 'queued' END,error_code='timeout',lease_token=NULL,lease_until=NULL,available_at=now(),finished_at=CASE WHEN attempts>=2 THEN now() ELSE NULL END WHERE state='processing' AND lease_until<now()`,
  );
  return (
    (
      await db.query(
        `WITH next AS (SELECT id FROM intake_analyses WHERE state='queued' AND available_at<=now() AND attempts<2 ORDER BY available_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1)
    UPDATE intake_analyses a SET state='processing',attempts=attempts+1,lease_token=$1,lease_until=now()+interval '90 seconds' FROM next WHERE a.id=next.id RETURNING a.*`,
        [randomUUID()],
      )
    ).rows[0] ?? null
  );
}
async function endJob(
  job: Job,
  state: "completed" | "blocked" | "failed" | "superseded" | "queued",
  code: string | null,
  result: IntakeSuggestion | null = null,
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const report = (
      await client.query(
        "SELECT status,version FROM reports WHERE id=$1 FOR UPDATE",
        [job.report_id],
      )
    ).rows[0];
    if (report?.status !== "pending" || report.version !== job.report_version) {
      state = "superseded";
      code = "stale";
      result = null;
    }
    await client.query(
      `UPDATE intake_analyses SET state=$1,error_code=$2,result=$3,lease_token=NULL,lease_until=NULL,finished_at=CASE WHEN $1='queued' THEN NULL ELSE now() END,available_at=CASE WHEN $1='queued' THEN now()+interval '5 seconds' ELSE available_at END
      WHERE id=$4 AND state='processing' AND lease_token=$5`,
      [
        state,
        code,
        result ? JSON.stringify(result) : null,
        job.id,
        job.lease_token,
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function runIntakeOnce() {
  const job = await claimJob();
  if (!job) return false;
  const config = aiConfiguration();
  try {
    const source = (
      await db.query(
        `SELECT r.description,r.status,r.version,e.content FROM reports r JOIN report_evidence e ON e.report_id=r.id WHERE r.id=$1`,
        [job.report_id],
      )
    ).rows[0];
    if (
      !source ||
      source.status !== "pending" ||
      source.version !== job.report_version
    ) {
      await endJob(job, "superseded", "stale");
      return true;
    }
    if (
      !job.ai_consent ||
      !permitsInitialAnalysis(job.consent_version) ||
      !job.consented_at
    ) {
      await endJob(job, "blocked", "privacy");
      return true;
    }
    if (!config.ready || process.env.AI_AUTOMATIC_ENABLED === "false") {
      await endJob(job, "blocked", "configuration");
      return true;
    }
    try {
      await limit("ai:intake:global", 60, 3600);
    } catch (error) {
      if (error instanceof HttpError && error.status === 429) {
        await endJob(job, "blocked", "quota");
        return true;
      }
      throw error;
    }
    await db.query(
      "UPDATE intake_analyses SET model=$1,transport=$2 WHERE id=$3 AND lease_token=$4",
      [
        config.model,
        config.simulation ? "simulation" : "openai",
        job.id,
        job.lease_token,
      ],
    );
    const result = await requestIntakeSuggestion(
      source.description,
      source.content,
      {
        model: config.model,
        apiKey: process.env.OPENAI_API_KEY!,
        endpoint: config.endpoint,
      },
    );
    await endJob(job, "completed", null, result);
  } catch (error) {
    const code = error instanceof ProviderError ? error.code : "unavailable";
    await endJob(
      job,
      job.attempts < 2 && ["timeout", "unavailable"].includes(code)
        ? "queued"
        : "failed",
      code,
    );
  }
  return true;
}
