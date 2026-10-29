import { insertPublicationImage } from "./publication-images";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./security";
import type { User } from "./auth";
import type { Evidence } from "./evidence";
import { categoryKeys } from "../lib/ai-contract";
import { AI_CONSENT_VERSION } from "../lib/consent";
export const sourceUrlField = z
  .string()
  .trim()
  .max(2048, "La URL es demasiado larga.")
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Usa una URL completa http:// o https://, sin contraseñas.");
export const reportFields = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Escribe al menos 5 caracteres.")
    .max(160, "Usa hasta 160 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "Describe la situación con al menos 20 caracteres.")
    .max(6000, "Usa hasta 6000 caracteres."),
});
export const publicSubmission = z
  .object({
    description: reportFields.shape.description,
    sourceUrl: sourceUrlField.default(""),
    consent: z.literal(true, {
      error: "Confirma que leíste el aviso de tratamiento.",
    }),
    consentVersion: z.literal(AI_CONSENT_VERSION, {
      error: "El aviso cambió. Recarga la página y revísalo antes de enviar.",
    }),
    website: z.string().max(0),
    token: z.string().max(200),
    submissionKey: z.uuid(),
  })
  .strict();
export const draftInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(6000),
    submit: z.boolean(),
    version: z.number().int().positive().optional(),
  })
  .strict();
export const publicationInput = z
  .object({
    title: reportFields.shape.title,
    body: reportFields.shape.description,
    categories: z
      .array(z.enum(categoryKeys))
      .max(4)
      .refine((values) => new Set(values).size === values.length)
      .default([]),
    summary: z.string().trim().max(800).default(""),
    context: z.string().trim().max(1800).default(""),
    findings: z.string().trim().max(1800).default(""),
    analysis: z.string().trim().max(1800).default(""),
    limitations: z.string().trim().max(1000).default(""),
    privacyConfirmed: z.literal(true),
    publicationConfirmed: z.literal(true),
    version: z.number().int().positive(),
  })
  .strict()
  .refine((data) => !data.analysis || data.limitations.length >= 10, {
    path: ["limitations"],
    message:
      "Indica los límites del análisis público (al menos 10 caracteres).",
  });
export const validationInput = z
  .object({
    confirmed: z.literal(true, {
      error: "Confirma la revisión humana antes de validar.",
    }),
    version: z.number().int().positive(),
    reviewedCategories: z.array(z.enum(categoryKeys)).max(4).default([]),
    reviewObservation: z.string().trim().max(2000).default(""),
  })
  .strict();
export const adjustmentInput = z
  .object({
    note: z
      .string()
      .trim()
      .min(10, "Describe el ajuste con al menos 10 caracteres.")
      .max(2000, "Usa hasta 2000 caracteres."),
    confirmed: z.literal(true, {
      error: "Confirma que deseas devolver el registro a su autora.",
    }),
    version: z.number().int().positive(),
  })
  .strict();
export type Report = {
  id: string;
  title: string;
  description: string;
  author_id: string | null;
  status: "draft" | "pending" | "needs_adjustments" | "validated" | "published";
  version: number;
  created_at: Date;
  validated_by: string | null;
  validated_at: Date | null;
  validation_source: "explicit" | "legacy_publication" | null;
  validator_username: string | null;
  source_url: string | null;
  has_evidence: boolean;
  reviewed_categories: string[];
  review_observation: string | null;
};
export async function createReport(
  title: string,
  description: string,
  author: string | null,
  submit: boolean,
  key: string | null = null,
  attachment?: {
    sourceUrl: string;
    evidence: Evidence;
    aiConsent: true;
  },
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const id = randomUUID();
    const inserted = await client.query(
      `INSERT INTO reports(id,title,description,author_id,status,submission_key,source_url)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(submission_key) DO NOTHING RETURNING id`,
      [
        id,
        title,
        description,
        author,
        submit ? "pending" : "draft",
        key,
        attachment?.sourceUrl || null,
      ],
    );
    if (inserted.rowCount && attachment)
      await client.query(
        "INSERT INTO report_evidence(report_id,content,width,height,sha256) VALUES($1,$2,$3,$4,$5)",
        [
          id,
          attachment.evidence.content,
          attachment.evidence.width,
          attachment.evidence.height,
          attachment.evidence.sha256,
        ],
      );
    if (inserted.rowCount && attachment)
      await client.query(
        "INSERT INTO intake_analyses(id,report_id,report_version,ai_consent,consent_version,consented_at,state) VALUES($1,$2,1,$3,$4,now(),'queued')",
        [randomUUID(), id, attachment.aiConsent, AI_CONSENT_VERSION],
      );
    if (inserted.rowCount)
      await client.query(
        "INSERT INTO report_events(id,report_id,actor_id,action) VALUES($1,$2,$3,$4)",
        [randomUUID(), id, author, submit ? "submitted" : "created"],
      );
    await client.query("COMMIT");
    return inserted.rows[0]?.id ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export const reportStatuses = [
  "draft",
  "pending",
  "needs_adjustments",
  "validated",
  "published",
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export async function reportQueueCounts(user: User) {
  const counts: Record<ReportStatus, number> = {
    draft: 0,
    pending: 0,
    needs_adjustments: 0,
    validated: 0,
    published: 0,
  };
  const result = await db.query<{ status: ReportStatus; total: string }>(
    `SELECT status,count(*) AS total FROM reports
     WHERE author_id=$1 OR ($2='reviewer' AND status<>'draft') GROUP BY status`,
    [user.id, user.role],
  );
  for (const row of result.rows) counts[row.status] = Number(row.total);
  return counts;
}

export async function listReports(user: User, page = 1, status?: ReportStatus) {
  return (
    await db.query<
      Pick<
        Report,
        | "id"
        | "title"
        | "description"
        | "author_id"
        | "status"
        | "version"
        | "created_at"
        | "has_evidence"
      >
    >(
      `SELECT id,title,description,author_id,status,version,created_at,
    EXISTS(SELECT 1 FROM report_evidence e WHERE e.report_id=reports.id) AS has_evidence FROM reports
    WHERE (author_id=$1 OR ($2='reviewer' AND status<>'draft'))
    AND ($4::text IS NULL OR status=$4) ORDER BY created_at DESC,id LIMIT 21 OFFSET $3`,
      [user.id, user.role, (page - 1) * 20, status ?? null],
    )
  ).rows;
}
export async function getReport(user: User, id: string) {
  if (!z.uuid().safeParse(id).success)
    throw new HttpError(404, "Registro no encontrado.");
  const result = await db.query<Report>(
    `SELECT r.id,r.title,r.description,r.author_id,r.status,r.version,r.created_at,r.validated_by,r.validated_at,r.validation_source,r.source_url,r.reviewed_categories,r.review_observation,EXISTS(SELECT 1 FROM report_evidence e WHERE e.report_id=r.id) AS has_evidence,u.username AS validator_username FROM reports r
    LEFT JOIN users u ON u.id=r.validated_by
    WHERE r.id=$1 AND (r.author_id=$2 OR ($3='reviewer' AND r.status<>'draft'))`,
    [id, user.id, user.role],
  );
  if (!result.rows[0]) throw new HttpError(404, "Registro no encontrado.");
  return result.rows[0];
}
export async function saveDraft(
  user: User,
  id: string,
  data: z.infer<typeof draftInput>,
) {
  if (data.submit) reportFields.parse(data);
  if (!data.version) throw new HttpError(400, "Falta la versión del borrador.");
  const report = await getReport(user, id);
  if (
    report.author_id !== user.id ||
    !["draft", "needs_adjustments"].includes(report.status)
  )
    throw new HttpError(
      409,
      "El registro ya no es editable. Recarga antes de continuar.",
    );
  const action =
    report.status === "needs_adjustments" ? "resubmitted" : "submitted";
  const result = await db.query(
    `WITH changed AS (
    UPDATE reports SET title=$1,description=$2,status=$3,version=version+1,updated_at=now()
    WHERE id=$4 AND author_id=$5 AND status=$7 AND version=$6
    AND EXISTS(SELECT 1 FROM users WHERE id=$5 AND enabled) RETURNING id,version
  ), event AS (
    INSERT INTO report_events(id,report_id,actor_id,action)
    SELECT $9,id,$5,$8 FROM changed WHERE $3='pending'
  ), resolved AS (
    UPDATE report_adjustments SET resolved_by=$5,resolved_at=now()
    WHERE report_id IN(SELECT id FROM changed) AND resolved_at IS NULL AND $3='pending' AND $8='resubmitted'
  ) SELECT id,version FROM changed`,
    [
      data.title,
      data.description,
      data.submit ? "pending" : report.status,
      id,
      user.id,
      data.version,
      report.status,
      action,
      randomUUID(),
    ],
  );
  if (!result.rowCount)
    throw new HttpError(
      409,
      "El borrador cambió o ya no es editable. Recarga antes de continuar.",
    );
  return result.rows[0];
}
export type Adjustment = {
  id: string;
  note: string;
  requested_by: string;
  requester_username: string;
  requested_at: Date;
  resolved_by: string | null;
  resolved_at: Date | null;
};
export async function listAdjustments(
  user: User,
  id: string,
): Promise<Adjustment[]> {
  await getReport(user, id);
  return (
    await db.query<Adjustment>(
      `SELECT a.id,a.note,a.requested_by,u.username AS requester_username,a.requested_at,a.resolved_by,a.resolved_at FROM report_adjustments a JOIN users u ON u.id=a.requested_by WHERE a.report_id=$1 ORDER BY a.requested_at DESC,a.id DESC LIMIT 10`,
      [id],
    )
  ).rows;
}
export async function requestAdjustments(
  user: User,
  id: string,
  input: unknown,
) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para solicitar ajustes.");
  const data = adjustmentInput.parse(input);
  const result = await db.query(
    `WITH changed AS (
    UPDATE reports SET status='needs_adjustments',version=version+1,updated_at=now()
    WHERE id=$1 AND status='pending' AND author_id IS NOT NULL AND version=$3
    AND EXISTS(SELECT 1 FROM users WHERE id=$2 AND enabled AND role='reviewer') RETURNING id,version
  ), adjustment AS (
    INSERT INTO report_adjustments(id,report_id,note,requested_by) SELECT $4,id,$5,$2 FROM changed
  ), event AS (
    INSERT INTO report_events(id,report_id,actor_id,action) SELECT $6,id,$2,'adjustments_requested' FROM changed
  ), superseded AS (
    UPDATE ai_analyses SET superseded_at=now() WHERE report_id IN(SELECT id FROM changed) AND superseded_at IS NULL
  ) SELECT id,version FROM changed`,
    [id, user.id, data.version, randomUUID(), data.note, randomUUID()],
  );
  if (!result.rowCount)
    throw new HttpError(
      409,
      "Solo puedes devolver registros internos pendientes y con versión vigente. Los envíos sin cuenta no admiten esta acción.",
    );
  return result.rows[0];
}
export async function validateReport(user: User, id: string, input: unknown) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para validar registros.");
  const data = validationInput.parse(input);
  const result = await db.query(
    `WITH changed AS (
    UPDATE reports SET status='validated',validated_by=$2,validated_at=now(),validation_source='explicit',reviewed_categories=$5,review_observation=$6,version=version+1,updated_at=now()
    WHERE id=$1 AND status='pending' AND version=$3
    AND EXISTS(SELECT 1 FROM users WHERE id=$2 AND enabled AND role='reviewer')
    RETURNING id,version,validated_at
  ), event AS (
    INSERT INTO report_events(id,report_id,actor_id,action) SELECT $4,id,$2,'validated' FROM changed
  ) SELECT id,version,validated_at FROM changed`,
    [
      id,
      user.id,
      data.version,
      randomUUID(),
      data.reviewedCategories,
      data.reviewObservation || null,
    ],
  );
  if (!result.rowCount)
    throw new HttpError(
      409,
      "El registro cambió, ya fue validado o no está pendiente. Recarga antes de continuar.",
    );
  return result.rows[0];
}
export async function publishReport(
  user: User,
  id: string,
  input: unknown,
  image?: import("./publication-images").ApprovedImage,
) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para publicar.");
  const data = publicationInput.parse(input);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (
      !(
        await client.query(
          "SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer' FOR SHARE",
          [user.id],
        )
      ).rowCount
    )
      throw new HttpError(403, "Tu cuenta no puede publicar.");
    const result = await client.query(
      `UPDATE reports SET status='published',version=version+1,updated_at=now()
      WHERE id=$1 AND status='validated' AND version=$2
      AND EXISTS(SELECT 1 FROM users WHERE id=$3 AND enabled AND role='reviewer') RETURNING id`,
      [id, data.version, user.id],
    );
    if (!result.rowCount)
      throw new HttpError(
        409,
        "Primero valida el registro internamente. Si ya fue validado o publicado, recarga antes de continuar.",
      );
    const publicationId = randomUUID();
    await client.query(
      "INSERT INTO publications(id,report_id,title,body,published_by,categories,summary,context,findings,analysis,limitations) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        publicationId,
        id,
        data.title,
        data.body,
        user.id,
        data.categories,
        data.summary,
        data.context,
        data.findings,
        data.analysis,
        data.limitations,
      ],
    );
    await client.query(
      `INSERT INTO publication_events(id,publication_id,actor_id,action,version,snapshot)
       SELECT $1,id,$2,'published',1,jsonb_build_object('title',title,'body',body,'categories',categories,'summary',summary,'context',context,'findings',findings,'analysis',analysis,'limitations',limitations)
       FROM publications WHERE id=$3`, [randomUUID(),user.id,publicationId],
    );
    if (image) {
      await client.query(
        "UPDATE publications SET image_version=1 WHERE id=$1",
        [publicationId],
      );
      await insertPublicationImage(client, publicationId, user.id, image, 1);
    }
    await client.query(
      "INSERT INTO report_events(id,report_id,actor_id,action) VALUES($1,$2,$3,$4)",
      [randomUUID(), id, user.id, "published"],
    );
    await client.query("COMMIT");
    return publicationId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
// Public queries deliberately project only the reviewed version: never SELECT reports.*.
export async function publications(page = 1) {
  return (
    await db.query<{
      id: string;
      title: string;
      body: string;
      published_at: Date;
      image_asset_id: string | null;
      image_description: string | null;
    }>(
      "SELECT p.id,p.title,p.body,p.published_at,i.asset_id AS image_asset_id,i.description AS image_description FROM publications p LEFT JOIN publication_images i ON i.publication_id=p.id WHERE p.withdrawn_at IS NULL ORDER BY p.published_at DESC,p.id LIMIT 13 OFFSET $1",
      [(page - 1) * 12],
    )
  ).rows;
}
export async function publication(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return (
    (
      await db.query<{
        id: string;
        title: string;
        body: string;
        published_at: Date;
        image_asset_id: string | null;
        image_description: string | null;
        categories: (keyof typeof import("../lib/ai-contract").categoryLabels)[];
        summary: string;
        context: string;
        findings: string;
        analysis: string;
        limitations: string;
      }>(
        "SELECT p.id,p.title,p.body,p.published_at,p.categories,p.summary,p.context,p.findings,p.analysis,p.limitations,i.asset_id AS image_asset_id,i.description AS image_description FROM publications p LEFT JOIN publication_images i ON i.publication_id=p.id WHERE p.id=$1 AND p.withdrawn_at IS NULL",
        [id],
      )
    ).rows[0] ?? null
  );
}
