import { z } from "zod";
export const dashboardFilters = z
  .object({
    periodo: z.enum(["30", "90", "365", "todo"]).default("30"),
    agrupar: z.enum(["clasificacion", "estado"]).default("clasificacion"),
  })
  .strict();
export type DashboardFilters = z.infer<typeof dashboardFilters>;
export function parseDashboardFilters(
  params: URLSearchParams,
): DashboardFilters {
  const values: Record<string, string | string[]> = Object.create(null);
  for (const [key, value] of params) {
    values[key] =
      key in values
        ? [value, ...(Array.isArray(values[key]) ? values[key] : [values[key]])]
        : value;
  }
  return dashboardFilters.parse(values);
}
export const dashboardPeriods = {
  "30": "Últimos 30 días",
  "90": "Últimos 90 días",
  "365": "Últimos 365 días",
  todo: "Todo el período",
};
