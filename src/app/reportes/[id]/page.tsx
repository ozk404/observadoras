import Link from "next/link";
import { notFound } from "next/navigation";
import { publication } from "@/server/reports";
import { PublicImage } from "@/components/public-image";
import { categoryLabels } from "@/lib/ai-contract";
import { publicationSections } from "@/lib/publication";
import { Arrow } from "@/components/icons";
import styles from "./publication.module.css";
export const dynamic = "force-dynamic";
export default async function PublicDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const row = await publication((await params).id);
  if (!row) notFound();
  return (
    <article className={styles.page}>
      <Link className={styles.back} href="/reportes">
        ← Reportes revisados
      </Link>
      <header className={styles.heading}>
        <div className={styles.meta}>
          <span>Publicación revisada</span>
          <time dateTime={row.published_at.toISOString()}>
            {new Intl.DateTimeFormat("es-GT", {
              dateStyle: "long",
              timeZone: "America/Guatemala",
            }).format(row.published_at)}
          </time>
        </div>
        <h1>{row.title}</h1>
        {row.categories.length > 0 && (
          <ul className={styles.categories} aria-label="Categorías aprobadas">
            {row.categories.map((key) => (
              <li key={key}>{categoryLabels[key] ?? key}</li>
            ))}
          </ul>
        )}
      </header>
      {row.summary && (
        <section className={styles.summary} aria-label="Resumen">
          <p>{row.summary}</p>
        </section>
      )}
      <div
        className={row.image_asset_id ? styles.contentGrid : styles.textOnly}
      >
        <div className={styles.editorial}>
          <section aria-labelledby="report-body-title">
            <h2 id="report-body-title">Reporte documentado</h2>
            <div className={styles.body}>{row.body}</div>
          </section>
          {publicationSections
            .filter(
              (field) =>
                field.key !== "summary" &&
                field.key !== "analysis" &&
                field.key !== "limitations",
            )
            .map(
              (field) =>
                row[field.key] && (
                  <section
                    key={field.key}
                    aria-labelledby={`section-${field.key}`}
                  >
                    <h2 id={`section-${field.key}`}>{field.heading}</h2>
                    <div className={styles.body}>{row[field.key]}</div>
                  </section>
                ),
            )}
        </div>
        {row.image_asset_id && (
          <aside
            className={styles.evidence}
            aria-labelledby="public-evidence-title"
          >
            <h2 id="public-evidence-title">Evidencia visual</h2>
            <PublicImage
              assetId={row.image_asset_id}
              description={row.image_description || "Imagen pública revisada"}
            />
            {row.image_description && (
              <p className={styles.caption}>{row.image_description}</p>
            )}
          </aside>
        )}
      </div>
      {row.analysis && (
        <section
          className={styles.analysis}
          aria-labelledby="public-analysis-title"
        >
          <div>
            <span className={styles.eyebrow}>Revisado por el equipo</span>
            <h2 id="public-analysis-title">Análisis del observatorio</h2>
            <div className={styles.body}>{row.analysis}</div>
          </div>
          {row.limitations && (
            <aside className={styles.limits}>
              <h3>Límites del análisis</h3>
              <div className={styles.body}>{row.limitations}</div>
            </aside>
          )}
        </section>
      )}
      {!row.analysis && row.limitations && (
        <section className={styles.standaloneLimits}>
          <h2>Límites de la información</h2>
          <div className={styles.body}>{row.limitations}</div>
        </section>
      )}
      <footer className={styles.footer}>
        <p>Esta publicación no constituye una determinación judicial.</p>
        <nav aria-label="Continuar desde el reporte">
          <Link href="/reportes">
            Ver más reportes <Arrow />
          </Link>
          <Link href="/reportar">
            Enviar un reporte <Arrow />
          </Link>
        </nav>
      </footer>
    </article>
  );
}
