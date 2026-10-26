import Link from "next/link";
import type { Metadata } from "next";
import { publications } from "@/server/reports";
import { Arrow } from "@/components/icons";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reportes revisados" };
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(params.pagina ?? "1") || 1),
  );
  const rows = await publications(page);
  return (
    <div className="wrap page-space">
      <div className="page-heading">
        <span className="eyebrow">Catálogo público</span>
        <h1>
          Relatos que hacen visible
          <br />
          lo que debe cambiar.
        </h1>
        <p>
          Versiones revisadas y aprobadas por el equipo del observatorio. Los
          relatos originales y los datos de las personas permanecen privados.
        </p>
      </div>
      <div className="catalog-heading">
        <h2>Reportes revisados</h2>
        <span className="help">Publicación con revisión humana</span>
      </div>
      {rows.length ? (
        <div className="catalog-grid">
          {rows.slice(0, 12).map((row) => (
            <article className="catalog-card" key={row.id}>
              <span className="eyebrow">Versión pública revisada</span>
              <h3>
                <Link href={`/reportes/${row.id}`}>{row.title}</Link>
              </h3>
              <p>
                {row.body.slice(0, 210)}
                {row.body.length > 210 ? "…" : ""}
              </p>
              <div className="card-bottom">
                <time dateTime={row.published_at.toISOString()}>
                  {new Intl.DateTimeFormat("es-GT", {
                    dateStyle: "medium",
                    timeZone: "America/Guatemala",
                  }).format(row.published_at)}
                </time>
                <Link
                  href={`/reportes/${row.id}`}
                  aria-label={`Leer: ${row.title}`}
                >
                  Leer relato <Arrow />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-index">—</span>
          <h2>
            {page > 1
              ? "No hay más publicaciones."
              : "Este espacio está por comenzar."}
          </h2>
          <p>
            Los reportes aparecerán aquí cuando el equipo haya revisado y
            aprobado una versión pública.
          </p>
          <Link className="button secondary" href="/reportar">
            Enviar un reporte <Arrow />
          </Link>
        </div>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link href={`/reportes?pagina=${page - 1}`}>← Anterior</Link>
        )}
        {rows.length > 12 && (
          <Link href={`/reportes?pagina=${page + 1}`}>Siguiente →</Link>
        )}
      </div>
    </div>
  );
}
