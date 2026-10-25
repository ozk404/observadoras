import Link from "next/link";
import { requireUser } from "@/server/auth";
import { listReports } from "@/server/reports";
import { Arrow } from "@/components/icons";
import { Status } from "@/components/status";
export default async function Queue({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(params.pagina ?? "1") || 1),
  );
  const reports = await listReports(user, page);
  return (
    <>
      <div className="queue-heading">
        <div>
          <span className="eyebrow">Información restringida</span>
          <h1>
            {user.role === "reviewer"
              ? "Registros y revisión"
              : "Mis registros"}
          </h1>
          <p>
            {user.role === "reviewer"
              ? "Revisa los envíos recibidos. Los borradores de otras personas permanecen privados."
              : "Guarda un borrador o envía tu registro al equipo del observatorio."}
          </p>
        </div>
        <Link className="button" href="/equipo/nuevo">
          Nuevo registro <Arrow />
        </Link>
      </div>
      {reports.length ? (
        <div className="report-list">
          {reports.slice(0, 20).map((report) => (
            <Link
              className="report-row"
              key={report.id}
              href={`/equipo/${report.id}`}
            >
              <div>
                <Status status={report.status} />
                <h2>{report.title}</h2>
                <span className="help">
                  {report.author_id ? "Registro interno" : "Envío sin cuenta"} ·{" "}
                  {new Intl.DateTimeFormat("es-GT", {
                    dateStyle: "medium",
                    timeZone: "America/Guatemala",
                  }).format(report.created_at)}
                </span>
              </div>
              <Arrow />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No hay registros en esta página.</h2>
          <p>
            Los registros que tengas permiso para consultar aparecerán aquí.
          </p>
        </div>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link href={`/equipo?pagina=${page - 1}`}>← Anterior</Link>
        )}
        {reports.length > 20 && (
          <Link href={`/equipo?pagina=${page + 1}`}>Siguiente →</Link>
        )}
      </div>
    </>
  );
}
