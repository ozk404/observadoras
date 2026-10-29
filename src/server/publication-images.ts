import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PoolClient } from "pg";
import type { User } from "./auth";
import type { Evidence } from "./evidence";
import { db } from "./db";
import { HttpError } from "./security";
export const IMAGE_AUTHORIZATION_VERSION = "public-image-2026-10-27";
export const imageApproval = z
  .object({
    description: z.string().trim().min(5).max(240),
    confirmed: z.literal(true),
  })
  .strict();
export type ApprovedImage = {
  evidence: Evidence;
  description: string;
  confirmed: true;
};
export async function insertPublicationImage(
  client: PoolClient,
  publicationId: string,
  actorId: string,
  image: ApprovedImage,
  version: number,
  action = "approved",
) {
  imageApproval.parse({
    description: image.description,
    confirmed: image.confirmed,
  });
  const assetId = randomUUID();
  await client.query(
    "INSERT INTO publication_images(publication_id,asset_id,content,width,height,description,approved_by,authorization_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      publicationId,
      assetId,
      image.evidence.content,
      image.evidence.width,
      image.evidence.height,
      image.description,
      actorId,
      IMAGE_AUTHORIZATION_VERSION,
    ],
  );
  await imageEvent(client, publicationId, actorId, version, action);
  return assetId;
}
async function imageEvent(
  client: PoolClient,
  publicationId: string,
  actorId: string,
  version: number,
  action: string,
) {
  await client.query(
    "INSERT INTO publication_image_events(id,publication_id,actor_id,action,image_version,authorization_version) VALUES($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      publicationId,
      actorId,
      action,
      version,
      IMAGE_AUTHORIZATION_VERSION,
    ],
  );
}
export async function publicImageContext(reportId: string) {
  return (
    (
      await db.query<{
        publication_id: string;
        image_version: number;
        asset_id: string | null;
        description: string | null;
      }>(
        "SELECT p.id AS publication_id,p.image_version,i.asset_id,i.description FROM publications p LEFT JOIN publication_images i ON i.publication_id=p.id WHERE p.report_id=$1",
        [reportId],
      )
    ).rows[0] ?? null
  );
}
export async function changePublicationImage(
  user: User,
  reportId: string,
  version: number,
  image: ApprovedImage | null,
) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para publicar imágenes.");
  z.string().uuid().parse(reportId);
  z.number().int().nonnegative().parse(version);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const actor = await client.query(
      "SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
      [user.id],
    );
    if (!actor.rowCount)
      throw new HttpError(403, "Tu cuenta no puede aprobar esta imagen.");
    const report = (
      await client.query("SELECT status FROM reports WHERE id=$1 FOR SHARE", [
        reportId,
      ])
    ).rows[0];
    if (report?.status !== "published")
      throw new HttpError(
        409,
        "Publica primero la versión revisada del reporte.",
      );
    const publication = (
      await client.query(
        "SELECT id,image_version,withdrawn_at FROM publications WHERE report_id=$1 FOR UPDATE",
        [reportId],
      )
    ).rows[0];
    if (!publication || publication.withdrawn_at || publication.image_version !== version)
      throw new HttpError(
        409,
        "La imagen pública cambió. Recarga antes de continuar.",
      );
    const removed = await client.query(
      "DELETE FROM publication_images WHERE publication_id=$1 RETURNING asset_id",
      [publication.id],
    );
    if (!image && !removed.rowCount)
      throw new HttpError(409, "Esta publicación no tiene imagen pública.");
    const next = version + 1;
    await client.query("UPDATE publications SET image_version=$2 WHERE id=$1", [
      publication.id,
      next,
    ]);
    let assetId: string | null = null;
    if (image)
      assetId = await insertPublicationImage(
        client,
        publication.id,
        user.id,
        image,
        next,
        removed.rowCount ? "replaced" : "approved",
      );
    else await imageEvent(client, publication.id, user.id, next, "removed");
    await client.query("COMMIT");
    return {
      imageVersion: next,
      assetId,
      description: image?.description ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Call only after authorizing access to this report.
export async function originalPublicationEvidence(
  reportId: string,
): Promise<Evidence> {
  const row = (
    await db.query(
      "SELECT content,width,height,sha256 FROM report_evidence WHERE report_id=$1",
      [reportId],
    )
  ).rows[0];
  if (!row)
    throw new HttpError(404, "El reporte no tiene una captura disponible.");
  return row;
}
