import Link from "next/link";
import { requireUser } from "@/server/auth";
import {
  listReports,
  reportQueueCounts,
  reportStatuses,
  type ReportStatus,
} from "@/server/reports";
import { Arrow } from "@/components/icons";
import { Status } from "@/components/status";
import { TeamNavigation } from "@/components/team-navigation";
import { TeamTour } from "@/components/team-tour";
import { EvidencePreview } from "@/components/evidence-preview";
import styles from "./queue.module.css";
export const metadata = { title: "Reportes del equipo" };
const filterLabels: Record<ReportStatus, string> = {
  draft: "Borradores",
  pending: "Pendientes",
  needs_adjustments: "Por ajustar",
  validated: "Validados",
  published: "Publicados",
};
function queueUrl(page = 1, status?: ReportStatus) {
  const params = new URLSearchParams();
  if (status) params.set("estado", status);
  if (page > 1) params.set("pagina", String(page));
  return `/equipo${params.size ? `?${params}` : ""}`;
}
export default async function Queue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(
      10000,
      Number.parseInt(
        typeof params.pagina === "string" ? params.pagina : "1",
      ) || 1,
    ),
  );
  const status = reportStatuses.find((status) => status === params.estado);
  const [reports, counts] = await Promise.all([
    listReports(user, page, status),
    reportQueueCounts(user),
  ]);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const rows = reports.slice(0, 20);
  const date = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeZone: "America/Guatemala",
  });
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <h1>{user.role === "reviewer" ? "Reportes" : "Mis reportes"}</h1>
        <div className={styles.headerActions}>
          {user.role === "reviewer" && <TeamNavigation inHeader />}
          <TeamTour reviewer={user.role === "reviewer"} />
        </div>
      </header>
      <nav
        data-team-tour="filters"
        className={styles.filters}
        aria-label="Filtrar reportes por estado"
      >
        <Link href={queueUrl()} aria-current={!status ? "page" : undefined}>
          Todos <span>{total}</span>
        </Link>
        {reportStatuses.map((value) => (
          <Link
            key={value}
            href={queueUrl(1, value)}
            aria-current={status === value ? "page" : undefined}
          >
            {filterLabels[value]} <span>{counts[value]}</span>
          </Link>
        ))}
      </nav>
      <section
        data-team-tour="reports"
        className={styles.records}
        aria-label="Listado de reportes"
      >
        {rows.length ? (
          <>
            <div className={styles.columns} aria-hidden="true">
              <span>Reporte</span>
              <span>Estado</span>
              <span>Origen</span>
              <span>Fecha</span>
              <span />
            </div>
            <ol className={styles.list}>
              {rows.map((report) => (
                <li key={report.id}>
                  <div className={styles.row}>
                    <div className={styles.lead}>
                      <EvidencePreview
                        id={report.id}
                        title={report.title}
                        available={report.has_evidence}
                      />
                      <h2>
                        <Link
                          data-team-tour="open"
                          href={`/equipo/${report.id}`}
                        >
                          {report.title}
                        </Link>
                      </h2>
                    </div>
                    <div className={styles.state}>
                      <Status status={report.status} />
                    </div>
                    <span className={styles.origin}>
                      {report.author_id
                        ? "Registro interno"
                        : "Envío sin cuenta"}
                    </span>
                    <time
                      className={styles.date}
                      dateTime={report.created_at.toISOString()}
                    >
                      {date.format(report.created_at)}
                    </time>
                    <Arrow />
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className={styles.empty}>
            <div aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <rect
                  x="11"
                  y="7"
                  width="26"
                  height="34"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M18 17h12M18 24h12M18 31h7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2>
              {page > 1
                ? "No hay reportes en esta página."
                : status
                  ? "No hay reportes en este estado."
                  : "Aún no hay reportes."}
            </h2>
            {page > 1 && (
              <Link href={queueUrl()}>
                Ver todos los reportes <Arrow />
              </Link>
            )}
          </div>
        )}
      </section>
      {(page > 1 || reports.length > 20) && (
        <nav className={styles.pagination} aria-label="Paginación de reportes">
          <span>Página {page}</span>
          <div>
            {page > 1 && (
              <Link href={queueUrl(page - 1, status)}>← Anterior</Link>
            )}
            {reports.length > 20 && (
              <Link href={queueUrl(page + 1, status)}>Siguiente →</Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
