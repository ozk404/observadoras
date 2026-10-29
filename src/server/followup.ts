import { randomUUID } from "node:crypto";
import type { User } from "./auth";
import { db } from "./db";
import { getReport } from "./reports";
import { HttpError } from "./security";
import { followupInput, type FollowupEntry } from "../lib/followup-contract";
function requireReviewer(user: User) {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "No tienes permiso para consultar o modificar el seguimiento.",
    );
}
export async function listFollowup(
  user: User,
  reportId: string,
): Promise<FollowupEntry[]> {
  requireReviewer(user);
  await getReport(user, reportId);
  const result = await db.query(
    `SELECT f.id,f.kind,f.note,u.username AS reviewer_username,f.created_at FROM report_followup_events f JOIN users u ON u.id=f.reviewer_id WHERE f.report_id=$1 ORDER BY f.created_at,f.id`,
    [reportId],
  );
  return result.rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
  }));
}
export async function writeFollowup(
  user: User,
  reportId: string,
  input: unknown,
) {
  requireReviewer(user);
  const data = followupInput.parse(input);
  await getReport(user, reportId);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const report = (
      await client.query(
        `SELECT status,version FROM reports WHERE id=$1 FOR UPDATE`,
        [reportId],
      )
    ).rows[0];
    const actor = await client.query(
      "SELECT id,username FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
      [user.id],
    );
    if (!actor.rowCount)
      throw new HttpError(
        403,
        "Tu cuenta no tiene permiso para modificar el seguimiento.",
      );
    if (
      !report ||
      !["validated", "published"].includes(report.status) ||
      report.version !== data.version
    )
      throw new HttpError(
        409,
        "El registro cambió o todavía no está validado. Recarga antes de continuar.",
      );
    if (
      (
        await client.query(
          "SELECT id FROM report_followup_events WHERE report_id=$1 AND kind='closed'",
          [reportId],
        )
      ).rowCount
    )
      throw new HttpError(409, "El seguimiento ya está cerrado.");
    const id = randomUUID();
    const inserted = await client.query(
      "INSERT INTO report_followup_events(id,report_id,kind,note,reviewer_id) VALUES($1,$2,$3,$4,$5) RETURNING id,kind,note,created_at",
      [
        id,
        reportId,
        data.action === "close" ? "closed" : "note",
        data.note,
        user.id,
      ],
    );
    const changed = await client.query(
      "UPDATE reports SET version=version+1,updated_at=now() WHERE id=$1 RETURNING version",
      [reportId],
    );
    await client.query("COMMIT");
    return {
      id,
      version: changed.rows[0].version,
      entry: {
        ...inserted.rows[0],
        created_at: inserted.rows[0].created_at.toISOString(),
        reviewer_username: actor.rows[0].username,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
