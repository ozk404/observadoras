import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import heroIllustration from "../../public/illustrations/hero.webp";
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
        <div className={styles.art} aria-hidden="true">
          <div className={styles.artInset} />
          <Image
            src={heroIllustration}
            alt=""
            preload
            sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1000px) 45vw, 608px"
            className={styles.heroIllustration}
          />
        </div>
      </section>
      <section className={styles.scope} aria-labelledby="scope-title">
        <h2 id="scope-title">Ámbitos de observación</h2>
        <div className={styles.scopeGrid}>
          <div className={styles.topic}>
            <h3>Violencia política digital</h3>
            <p>
              Acoso, amenazas, suplantación y ataques contra mujeres
              relacionados con su participación política en entornos digitales.
            </p>
          </div>
          <div className={styles.topic}>
            <h3>Desinformación</h3>
            <p>
              Contenido falso o manipulado sobre mujeres y su participación
              política, documentado para revisión del observatorio.
            </p>
          </div>
          <div className={styles.topic}>
            <h3>Barreras a la participación</h3>
            <p>
              Obstáculos para acceder, permanecer o ejercer derechos en espacios
              de decisión y participación política.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.purpose} aria-labelledby="purpose-title">
        <div className={styles.purposeInner}>
          <h2 id="purpose-title">
            Hallazgos para el monitoreo y la incidencia.
          </h2>
          <p>
            El observatorio organiza los registros ciudadanos para documentar
            problemáticas y sustentar propuestas de la Fundación ante
            instituciones estatales.
          </p>
        </div>
      </section>

      <section className={styles.tools} aria-labelledby="tools-title">
        <h2 id="tools-title">Herramientas del observatorio</h2>
        <dl className={styles.toolRows}>
          <div>
            <dt>Registro y seguimiento</dt>
            <dd>
              El equipo consulta los hallazgos, registra notas y conserva su
              estado de revisión y seguimiento.
            </dd>
          </div>
          <div>
            <dt>Análisis asistido por IA</dt>
            <dd>
              Sugerencias de clasificación, resúmenes y borradores de alertas
              sujetos a revisión humana.
            </dd>
          </div>
          <div>
            <dt>Consulta agregada</dt>
            <dd>
              Un panel privado reúne reportes validados por período,
              clasificación humana y estado.
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.about} aria-labelledby="program-title">
        <div className={styles.program}>
          <h2 id="program-title">Programa Paridad 2026</h2>
          <p>
            Una iniciativa de Fundación Oxlajuj No’j dirigida a mujeres jóvenes
            y juventudes diversas en Guatemala. Vincula el monitoreo ciudadano
            con la incidencia normativa y las acciones sociojurídicas.
          </p>
        </div>
        <aside
          className={styles.territory}
          aria-label="Alcance territorial del programa"
        >
          <h3>Alcance territorial</h3>
          <ul>
            <li>Guatemala</li>
            <li>Baja Verapaz</li>
            <li>Quetzaltenango</li>
            <li>Jutiapa</li>
            <li>San Marcos</li>
            <li>Quiché</li>
          </ul>
        </aside>
      </section>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <h2 id="catalog-title">Reportes publicados</h2>
        <Link className={styles.inverse} href="/reportes">
          Ver el catálogo <Arrow />
        </Link>
      </section>
    </div>
  );
}
