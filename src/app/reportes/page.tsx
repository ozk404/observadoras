import Link from "next/link";
import type { Metadata } from "next";
import { publications } from "@/server/reports";
import { Arrow } from "@/components/icons";
import { PublicImageThumbnail } from "@/components/public-image-thumbnail";
import styles from "./catalog.module.css";
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
  const date = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeZone: "America/Guatemala",
  });
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.hero}>
        <div>
          <h1>Reportes revisados</h1>
          <p>
            Publicaciones aprobadas por el equipo del observatorio. Los
            originales permanecen privados; las imágenes públicas se revisan por
            separado.
          </p>
        </div>
        <Link href="/reportar" className={styles.report}>
          Enviar un reporte <Arrow />
        </Link>
      </header>
      {rows.length ? (
        <section className={styles.grid} aria-label="Publicaciones revisadas">
          {rows.slice(0, 12).map((row) => (
            <article className={styles.card} key={row.id}>
              {row.image_asset_id && (
                <PublicImageThumbnail
                  className={styles.image}
                  assetId={row.image_asset_id}
                  description={
                    row.image_description || "Imagen pública revisada"
                  }
                />
              )}
              <time dateTime={row.published_at.toISOString()}>
                {date.format(row.published_at)}
              </time>
              <h2>
                <Link href={`/reportes/${row.id}`}>{row.title}</Link>
              </h2>
              <p>
                {row.body.slice(0, 260)}
                {row.body.length > 260 ? "…" : ""}
              </p>
              <span className={styles.read} aria-hidden="true">
                Leer reporte <Arrow />
              </span>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.empty} aria-label="Catálogo sin resultados">
          <h2>
            {page > 1
              ? "No hay publicaciones en esta página."
              : "Todavía no hay reportes publicados."}
          </h2>
          {page > 1 && (
            <Link href="/reportes">
              Volver al catálogo <Arrow />
            </Link>
          )}
        </section>
      )}
      {(page > 1 || rows.length > 12) && (
        <nav
          className={styles.pagination}
          aria-label="Paginación de reportes públicos"
        >
          <div>
            {page > 1 && (
              <Link href={`/reportes?pagina=${page - 1}`}>← Anterior</Link>
            )}
          </div>
          <span>Página {page}</span>
          <div>
            {rows.length > 12 && (
              <Link href={`/reportes?pagina=${page + 1}`}>Siguiente →</Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
