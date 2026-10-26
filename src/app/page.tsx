import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Reportes de violencia política digital",
  description:
    "Envía reportes al observatorio y consulta las versiones revisadas y aprobadas por el equipo de Fundación Oxlajuj No’j.",
};
export default function Home() {
  return (
    <div className={`home-v2 ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <h1 id="home-title">
            Reportes de <span>violencia política digital.</span>
          </h1>
          <p>
            Comparte situaciones de acoso, desinformación o barreras a la
            participación política de las mujeres.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/reportar">
              Enviar un reporte <Arrow />
            </Link>
            <Link className={styles.textLink} href="/reportes">
              Explorar reportes <Arrow />
            </Link>
          </div>
        </div>
        {/* Reserved for the illustration described in docs/diseno/ADN-V2-PROPUESTA.md. */}
        <div className={styles.art} aria-hidden="true">
          <div className={styles.artInset} />
        </div>
      </section>
      <section className={styles.review} aria-labelledby="review-title">
        <div className={styles.reviewCopy}>
          <h2 id="review-title">
            Original privado.
            <br />
            Versión pública revisada.
          </h2>
          <p>La captura y la URL no aparecen en el catálogo.</p>
          <Link href="/privacidad" className={styles.textLink}>
            Tratamiento de la información <Arrow />
          </Link>
        </div>
        <ol className={styles.steps}>
          <li>
            <span aria-hidden="true">01</span>
            <h3>Envío privado</h3>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <h3>Revisión del equipo</h3>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <h3>Publicación tras aprobación</h3>
          </li>
        </ol>
      </section>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <h2 id="catalog-title">Reportes aprobados para consulta pública.</h2>
        <Link className={styles.inverse} href="/reportes">
          Ver el catálogo <Arrow />
        </Link>
      </section>
    </div>
  );
}
