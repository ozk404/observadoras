import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import type { User } from "./auth";
import { HttpError } from "./security";
import { getReport, publicationInput } from "./reports";
import type { PublicationContext, PublicationCopy } from "../lib/publication";

const reason = z
  .string()
  .trim()
  .min(10, "Explica el motivo con al menos 10 caracteres.")
  .max(1000);
const correction = z
  .object({
    content: publicationInput,
    reason,
    restore: z.boolean().default(false),
  })
  .strict();
const withdrawal = z
  .object({
    version: z.number().int().positive(),
    reason,
    confirmed: z.literal(true),
  })
  .strict();

export async function getPublicationContext(
  user: User,
  reportId: string,
): Promise<PublicationContext | null> {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "No tienes permiso para administrar publicaciones.",
    );
  await getReport(user, reportId);
  const publication = (
    await db.query<PublicationContext["publication"]>(
      `SELECT id,title,body,categories,summary,context,findings,analysis,limitations,version,
     published_at::text,updated_at::text,withdrawn_at::text FROM publications WHERE report_id=$1`,
      [reportId],
    )
  ).rows[0];
  if (!publication) return null;
  const events = (
    await db.query<PublicationContext["events"][number]>(
      `SELECT e.id,e.action,e.version,e.reason,e.created_at::text,coalesce(u.full_name,u.username) AS actor_name
     FROM publication_events e JOIN users u ON u.id=e.actor_id
     WHERE e.publication_id=$1 ORDER BY e.version DESC LIMIT 10`,
      [publication.id],
    )
  ).rows;
  const image = (
    await db.query<PublicationContext["image"]>(
      `SELECT p.image_version,i.asset_id,i.description FROM publications p
     LEFT JOIN publication_images i ON i.publication_id=p.id WHERE p.id=$1`,
      [publication.id],
    )
  ).rows[0];
  return {
    publication: { ...publication, published_at: new Date(publication.published_at).toISOString(), updated_at: new Date(publication.updated_at).toISOString(), withdrawn_at: publication.withdrawn_at ? new Date(publication.withdrawn_at).toISOString() : null },
    events: events.map(event => ({...event,created_at:new Date(event.created_at).toISOString()})),
    image,
  };
}

export async function managePublication(
  user: User,
  reportId: string,
  input: unknown,
  remove = false,
) {
  if (user.role !== "reviewer")
    throw new HttpError(
      403,
      "No tienes permiso para administrar publicaciones.",
    );
  if (!z.uuid().safeParse(reportId).success)
    throw new HttpError(404, "Reporte no encontrado.");
  const change = remove ? null : correction.parse(input);
  const removal = remove ? withdrawal.parse(input) : null;
  const version = removal?.version ?? change!.content.version;
  const motive = removal?.reason ?? change!.reason;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const actor = await client.query(
      "SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
      [user.id],
    );
    if (!actor.rowCount)
      throw new HttpError(
        403,
        "Tu cuenta no puede administrar esta publicación.",
      );
    const report = (
      await client.query("SELECT status FROM reports WHERE id=$1 FOR SHARE", [
        reportId,
      ])
    ).rows[0];
    if (report?.status !== "published")
      throw new HttpError(409, "El reporte todavía no tiene una publicación.");
    const current = (
      await client.query(
        "SELECT id,version,withdrawn_at,image_version FROM publications WHERE report_id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    if (!current || current.version !== version)
      throw new HttpError(
        409,
        "La publicación cambió. Recarga antes de continuar; conserva tus cambios.",
      );
    if (removal && current.withdrawn_at)
      throw new HttpError(409, "Esta publicación ya está retirada.");
    if (change && Boolean(current.withdrawn_at) !== change.restore)
      throw new HttpError(
        409,
        "El estado de la publicación cambió. Recarga antes de aprobar.",
      );
    const next = version + 1;
    let snapshot: PublicationCopy | null = null;
    const action = removal
      ? "withdrawn"
      : current.withdrawn_at
        ? "republished"
        : "corrected";
    if (removal) {
      await client.query(
        "UPDATE publications SET withdrawn_at=now(),updated_at=now(),version=$2,image_version=image_version+1 WHERE id=$1",
        [current.id, next],
      );
      const image = await client.query(
        "DELETE FROM publication_images WHERE publication_id=$1 RETURNING asset_id",
        [current.id],
      );
      if (image.rowCount)
        await client.query(
          `INSERT INTO publication_image_events(id,publication_id,actor_id,action,image_version,authorization_version)
         VALUES($1,$2,$3,'removed',$4,'publication-withdrawal-2026-10-29')`,
          [randomUUID(), current.id, user.id, current.image_version + 1],
        );
    } else {
      const c = change!.content;
      snapshot = {
        title: c.title,
        body: c.body,
        categories: c.categories,
        summary: c.summary,
        context: c.context,
        findings: c.findings,
        analysis: c.analysis,
        limitations: c.limitations,
      };
      await client.query(
        `UPDATE publications SET title=$2,body=$3,categories=$4,summary=$5,context=$6,findings=$7,analysis=$8,limitations=$9,
         version=$10,updated_at=now(),withdrawn_at=NULL WHERE id=$1`,
        [
          current.id,
          c.title,
          c.body,
          c.categories,
          c.summary,
          c.context,
          c.findings,
          c.analysis,
          c.limitations,
          next,
        ],
      );
    }
    await client.query(
      "INSERT INTO publication_events(id,publication_id,actor_id,action,version,reason,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        randomUUID(),
        current.id,
        user.id,
        action,
        next,
        motive,
        snapshot ? JSON.stringify(snapshot) : null,
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return getPublicationContext(user, reportId);
}
