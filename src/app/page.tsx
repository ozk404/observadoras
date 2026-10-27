import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Observatorio ciudadano digital",
  description:
    "Documentación, análisis y seguimiento de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala. Fundación Oxlajuj No’j · Programa Paridad 2026.",
};
export default function Home() {
  return (
    <div className={`home-v2 ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <h1 id="home-title">
            Observatorio <span>ciudadano digital.</span>
          </h1>
          <p>
            Documentamos y analizamos violencia política digital, desinformación
            y barreras a la participación política de las mujeres en Guatemala.
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
      <div className={styles.about}>
        <section className={styles.program} aria-labelledby="program-title">
          <h2 id="program-title">Programa Paridad 2026</h2>
          <p>
            Generación de evidencia y propuestas ante instituciones estatales
            sobre las barreras a la participación política de mujeres jóvenes y
            juventudes diversas.
          </p>
        </section>
        <section className={styles.analysis} aria-labelledby="analysis-title">
          <h2 id="analysis-title">Análisis asistido por IA</h2>
          <p>
            Clasificación, resúmenes y borradores de alertas bajo revisión del
            equipo del observatorio.
          </p>
        </section>
      </div>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <h2 id="catalog-title">Reportes publicados</h2>
        <Link className={styles.inverse} href="/reportes">
          Ver el catálogo <Arrow />
        </Link>
      </section>
    </div>
  );
}
