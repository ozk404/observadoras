import Link from "next/link";
import { notFound } from "next/navigation";
import { publication } from "@/server/reports";
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
      </header>
      <div className={styles.body}>{row.body}</div>
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
