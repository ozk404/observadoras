import type { PoolClient } from "pg";
import type { User } from "./auth";
import { db } from "./db";
import { HttpError } from "./security";
import { categoryKeys, categoryLabels } from "../lib/ai-contract";
import { dashboardFilters, type DashboardFilters } from "../lib/dashboard";
export async function getDashboard(
  user: User,
  input: DashboardFilters,
  queryable: Pick<PoolClient, "query"> = db,
) {
  if (user.role !== "reviewer")
    throw new HttpError(403, "No tienes permiso para consultar el resumen.");
  const filters = dashboardFilters.parse(input);
  const result = await queryable.query(
    `
    WITH actor AS (
      SELECT id FROM users WHERE id=$1 AND enabled AND role='reviewer'
    ), eligible AS (
      SELECT id,status,reviewed_categories FROM reports
      WHERE status IN ('validated','published') AND EXISTS(SELECT 1 FROM actor)
      AND validated_at<=now()
      AND ($2::int IS NULL OR validated_at>=now()-$2::int*interval '1 day')
    ), normalized AS (
      SELECT id,ARRAY(SELECT DISTINCT c FROM unnest(reviewed_categories) c WHERE c=ANY($4::text[]) ORDER BY c) AS categories FROM eligible
    ), classified AS (
      SELECT id,unnest(CASE WHEN cardinality(categories)=0 THEN ARRAY['sin_clasificar'] ELSE categories END) AS key FROM normalized
    ), counts AS (
      SELECT key,count(*)::int AS count FROM classified WHERE $3='clasificacion' GROUP BY key
      UNION ALL
      SELECT status AS key,count(*)::int AS count FROM eligible WHERE $3='estado' GROUP BY status
    ) SELECT (SELECT count(*)::int FROM eligible) AS total,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('key',key,'count',count) ORDER BY count DESC,key) FROM counts),'[]') AS rows
      FROM actor`,
    [
      user.id,
      filters.periodo === "todo" ? null : Number(filters.periodo),
      filters.agrupar,
      categoryKeys,
    ],
  );
  if (!result.rows[0])
    throw new HttpError(403, "Tu cuenta no puede consultar el resumen.");
  const { total, rows } = result.rows[0] as {
    total: number;
    rows: { key: string; count: number }[];
  };
  const labels: Record<string, string> =
    filters.agrupar === "clasificacion"
      ? categoryLabels
      : { validated: "Validado internamente", published: "Publicado" };
  return {
    total,
    rows: rows.map((row) => ({
      ...row,
      label: labels[row.key],
      percentage: total ? Math.round((row.count * 1000) / total) / 10 : 0,
    })),
  };
}
