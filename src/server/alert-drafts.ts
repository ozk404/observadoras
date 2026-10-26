import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { User } from "./auth";
import { db } from "./db";
import { getReport } from "./reports";
import { HttpError } from "./security";
import { latestAlertGeneration } from "./alert-generations";
import {
  alertDraftInput,
  type AlertContext,
  type AlertDraft,
} from "../lib/alert-contract";

function requireReviewer(user: User) {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "No tienes permiso para consultar o editar borradores de alertas.",
    );
}
async function readDraft(
  reportId: string,
  client: Pick<PoolClient, "query"> = db,
): Promise<AlertDraft | null> {
  const row = (
    await client.query(
      `SELECT a.id,a.title,a.body,a.version,a.created_at,a.updated_at,a.intake_analysis_id,a.prepared_analysis_id,a.alert_generation_id,c.username AS creator_username,e.username AS editor_username FROM alert_drafts a JOIN users c ON c.id=a.created_by JOIN users e ON e.id=a.updated_by WHERE a.report_id=$1`,
      [reportId],
    )
  ).rows[0];
  if (!row) return null;
  const {
    intake_analysis_id,
    prepared_analysis_id,
    alert_generation_id,
    ...value
  } = row;
  return {
    ...value,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    source: alert_generation_id
      ? { kind: "generated", id: alert_generation_id }
      : intake_analysis_id
        ? { kind: "initial", id: intake_analysis_id }
        : prepared_analysis_id
          ? { kind: "prepared", id: prepared_analysis_id }
          : null,
  };
}
export async function getAlertContext(
  user: User,
  reportId: string,
): Promise<AlertContext> {
  requireReviewer(user);
  const report = await getReport(user, reportId);
  if (!["validated", "published"].includes(report.status))
    throw new HttpError(409, "Primero valida el registro internamente.");
  const row = (
    await db.query(
      `SELECT id,kind,summary FROM (
    SELECT id,'initial' AS kind,result->>'summary' AS summary,finished_at FROM intake_analyses WHERE report_id=$1 AND state='completed'
    UNION ALL
    SELECT id,'prepared' AS kind,result->>'summary' AS summary,finished_at FROM ai_analyses WHERE report_id=$1 AND status='succeeded' AND superseded_at IS NULL
  ) candidates ORDER BY finished_at DESC NULLS LAST,id LIMIT 1`,
      [reportId],
    )
  ).rows[0];
  const base =
    row &&
    typeof row.summary === "string" &&
    row.summary.length >= 20 &&
    row.summary.length <= 2400
      ? { source: { kind: row.kind, id: row.id }, summary: row.summary }
      : null;
  return {
    draft: await readDraft(reportId),
    base,
    generation: await latestAlertGeneration(user, reportId),
  };
}
export async function saveAlertDraft(
  user: User,
  reportId: string,
  input: unknown,
) {
  requireReviewer(user);
  const data = alertDraftInput.parse(input);
  await getReport(user, reportId);
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
    if (!actor.rowCount)
      throw new HttpError(
        403,
        "Tu cuenta no tiene permiso para editar alertas.",
      );
    if (
      !report ||
      !["validated", "published"].includes(report.status) ||
      report.version !== data.reportVersion
    )
      throw new HttpError(
        409,
        "El registro cambió o todavía no está validado. Recarga antes de continuar.",
      );
    const current = (
      await client.query(
        "SELECT version,alert_generation_id FROM alert_drafts WHERE report_id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    if ((current?.version ?? 0) !== data.draftVersion)
      throw new HttpError(
        409,
        "Otra revisora modificó el borrador. Conserva tu texto y recarga antes de continuar.",
      );
    if (data.source) {
      const source =
        data.source.kind === "generated"
          ? await client.query(
              "SELECT id FROM alert_generations WHERE id=$1 AND report_id=$2 AND status='succeeded' AND (id=$3 OR (report_version=$4 AND draft_version=$5)) FOR SHARE",
              [
                data.source.id,
                reportId,
                current?.alert_generation_id ?? null,
                data.reportVersion,
                data.draftVersion,
              ],
            )
          : data.source.kind === "initial"
            ? await client.query(
                "SELECT id FROM intake_analyses WHERE id=$1 AND report_id=$2 AND state='completed' FOR SHARE",
                [data.source.id, reportId],
              )
            : await client.query(
                "SELECT id FROM ai_analyses WHERE id=$1 AND report_id=$2 AND status='succeeded' AND superseded_at IS NULL FOR SHARE",
                [data.source.id, reportId],
              );
      if (!source.rowCount)
        throw new HttpError(
          409,
          "La fuente de IA no pertenece al registro o ya no está vigente.",
        );
    }
    const initial = data.source?.kind === "initial" ? data.source.id : null;
    const prepared = data.source?.kind === "prepared" ? data.source.id : null;
    const generated = data.source?.kind === "generated" ? data.source.id : null;
    if (current) {
      await client.query(
        "UPDATE alert_drafts SET title=$2,body=$3,version=version+1,updated_by=$4,updated_at=now(),intake_analysis_id=$5,prepared_analysis_id=$6,alert_generation_id=$7 WHERE report_id=$1",
        [
          reportId,
          data.title,
          data.body,
          user.id,
          initial,
          prepared,
          generated,
        ],
      );
    } else {
      await client.query(
        "INSERT INTO alert_drafts(id,report_id,title,body,created_by,updated_by,intake_analysis_id,prepared_analysis_id,alert_generation_id) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8)",
        [
          randomUUID(),
          reportId,
          data.title,
          data.body,
          user.id,
          initial,
          prepared,
          generated,
        ],
      );
    }
    const draft = await readDraft(reportId, client);
    await client.query("COMMIT");
    return draft!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
