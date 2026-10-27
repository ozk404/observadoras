import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getDashboard } from "@/server/dashboard";
import {
  dashboardPeriods,
  parseDashboardFilters,
  type DashboardFilters,
} from "@/lib/dashboard";
import { TeamNavigation } from "@/components/team-navigation";
import styles from "./dashboard.module.css";
export const metadata = { title: "Resumen del observatorio" };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (user.role !== "reviewer") notFound();
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw))
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      params.append(key, item);
  let filters: DashboardFilters;
  try {
    filters = parseDashboardFilters(params);
  } catch {
    return (
      <div className={styles.page}>
        <header className={styles.heading}>
          <h1>Resumen</h1>
          <TeamNavigation inHeader canManageUsers={user.can_manage_users} />
        </header>
        <section className={styles.invalid}>
          <p className="error" role="alert">
            Filtros no válidos.
          </p>
          <Link href="/equipo/dashboard">Restablecer filtros</Link>
        </section>
      </div>
    );
  }
  const data = await getDashboard(user, filters);
  const heading =
    filters.agrupar === "clasificacion"
      ? "Clasificación humana"
      : "Estado del reporte";
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <h1>Resumen</h1>
        <TeamNavigation inHeader canManageUsers={user.can_manage_users} />
      </header>
      <form
        key={`${filters.periodo}:${filters.agrupar}`}
        method="get"
        className={styles.filters}
      >
        <div>
          <label htmlFor="dashboard-period">Fecha de validación</label>
          <select
            id="dashboard-period"
            name="periodo"
            defaultValue={filters.periodo}
          >
            {Object.entries(dashboardPeriods).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dashboard-group">Agrupar por</label>
          <select
            id="dashboard-group"
            name="agrupar"
            defaultValue={filters.agrupar}
          >
            <option value="clasificacion">Clasificación humana</option>
            <option value="estado">Estado del reporte</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.apply}>Aplicar</button>
          <Link href="/equipo/dashboard" className={styles.reset}>
            Restablecer
          </Link>
        </div>
      </form>
      <div className={styles.grid}>
        <section
          className={styles.total}
          aria-label="Total de reportes validados"
        >
          <div>
            <h2>Reportes validados</h2>
            <span>Incluye los publicados</span>
          </div>
          <p data-testid="dashboard-total">
            {data.total.toLocaleString("es-GT")}
          </p>
        </section>
        <section className={styles.chart} aria-labelledby="distribution-title">
          <h2 id="distribution-title">{heading}</h2>
          {data.total ? (
            <ol className={styles.bars}>
              {data.rows.map((row) => (
                <li key={row.key}>
                  <div>
                    <span>{row.label}</span>
                    <strong>{row.count}</strong>
                  </div>
                  <div className={styles.track} aria-hidden="true">
                    <span style={{ width: `${row.percentage}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>
              Sin reportes validados en este período.
            </p>
          )}
        </section>
        <section className={styles.table} aria-label="Distribución agregada">
          <table>
            <caption>Distribución de reportes</caption>
            <thead>
              <tr>
                <th scope="col">{heading}</th>
                <th scope="col">Reportes</th>
                <th scope="col" aria-label="Porcentaje">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{row.count}</td>
                  <td>
                    {row.percentage.toLocaleString("es-GT", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
              ))}
              {!data.rows.length && (
                <tr>
                  <td colSpan={3}>Sin datos para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
          {filters.agrupar === "clasificacion" && data.total > 0 && (
            <p className={styles.note}>
              Un reporte puede tener varias categorías; los porcentajes pueden
              sumar más de 100%.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
