import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import heroIllustration from "../../public/illustrations/hero.webp";
import reportIllustration from "../../public/illustrations/intro.webp";
import partnerLogo1 from "../../public/illustrations/lc1.webp";
import partnerLogo2 from "../../public/illustrations/lc2.webp";
import partnerLogo3 from "../../public/illustrations/lc3.webp";
import partnerLogo4 from "../../public/illustrations/lc4.webp";
import partnerLogo5 from "../../public/illustrations/lc5.webp";
import { Arrow, ObservationIcon } from "@/components/icons";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Observatorio de Violencia Política · Fundación Oxlajuj N’oj",
  },
  description:
    "Documentación, análisis y seguimiento de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala. Fundación Oxlajuj No’j · Programa Paridad 2026.",
};
const projectLogos = [
  { id: 1, image: partnerLogo1, name: "Paridad", href: null },
  { id: 2, image: partnerLogo2, name: "Diakonia", href: null },
  { id: 3, image: partnerLogo3, name: "CLADEM, con el apoyo de Suecia", href: null },
  { id: 4, image: partnerLogo4, name: "Fundación Oxlajuj N’oj", href: "https://www.fundacionoxlajujnoj.org/" },
  { id: 5, image: partnerLogo5, name: "Tecsify", href: "https://tecsify.com/" },
];

export default function Home() {
  return (
    <div className={`home-v2 ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <h1 id="home-title">
            Observatorio <span>de Violencia Política</span>
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
      <section className={styles.introduction} aria-labelledby="what-title">
        <div className={styles.introStatement}>
          <h2 id="what-title">¿Qué es el observatorio?</h2>
          <p>Un espacio de <strong>monitoreo ciudadano.</strong></p>
        </div>
        <div className={styles.introContent}>
          <p>
            Fundación Oxlajuj N’oj desarrolla el Observatorio de Violencia
            Política en el marco del Programa Paridad 2026 para documentar,
            sistematizar y dar seguimiento a casos de violencia política,
            desinformación y barreras a la participación política de las mujeres.
          </p>
          <p className={styles.introClosing}>
            La evidencia reunida respalda y orienta las acciones del Programa.
          </p>
        </div>
      </section>
      <section className={styles.scope} aria-labelledby="scope-title">
        <h2 id="scope-title">Ámbitos de observación</h2>
        <div className={styles.scopeGrid}>
          <div className={styles.topic}>
            <h3><span className={styles.topicIcon}><ObservationIcon kind="violence" /></span>Violencia política digital</h3>
            <p>
              Acoso, amenazas, suplantación y ataques contra mujeres
              relacionados con su participación política en entornos digitales.
            </p>
          </div>
          <div className={styles.topic}>
            <h3><span className={styles.topicIcon}><ObservationIcon kind="information" /></span>Desinformación</h3>
            <p>
              Contenido falso o manipulado sobre mujeres y su participación
              política, documentado para revisión del observatorio.
            </p>
          </div>
          <div className={styles.topic}>
            <h3><span className={styles.topicIcon}><ObservationIcon kind="barrier" /></span>Barreras a la participación</h3>
            <p>
              Obstáculos para acceder, permanecer o ejercer derechos en espacios
              de decisión y participación política.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.purpose} aria-labelledby="purpose-title">
        <div className={styles.purposeInner}>
          <div className={styles.objective}>
            <h2 id="purpose-title">Objetivo del observatorio</h2>
            <p className={styles.objectiveLead}>Visibilizar la violencia política digital.</p>
            <p>
              Recopilamos, documentamos, sistematizamos y analizamos información
              sobre situaciones que limitan, obstaculizan o impiden la
              participación de las mujeres en espacios de decisión.
            </p>
          </div>
          <aside className={styles.evidenceCommitment}>
            <h3>Una base de evidencia confiable y accesible.</h3>
            <p>
              Nuestro compromiso es comprender las barreras que enfrentan las
              mujeres y fortalecer las garantías para el ejercicio libre y
              seguro de sus derechos políticos.
            </p>
          </aside>
        </div>
      </section>

      <section className={styles.about} aria-labelledby="program-title">
        <div className={styles.program}>
          <h2 id="program-title">¿Qué es el Programa <span>Paridad 2026?</span></h2>
          <p>
            Una iniciativa de Fundación Oxlajuj N’oj para fortalecer la
            participación política y ciudadana de mujeres jóvenes y juventudes
            diversas.
          </p>
          <p>
            Identifica y documenta barreras, violencia política,
            desinformación, exclusión y discriminación. Su finalidad es que el
            principio de paridad se traduzca en una participación efectiva de
            las mujeres en los espacios de toma de decisiones.
          </p>
          <div className={styles.programSupport}>
            <span>Apoyo técnico</span>
            <strong>CLADEM</strong>
            <p>Comité de América Latina y El Caribe para la Defensa de los Derechos de las Mujeres.</p>
          </div>
        </div>
        <aside className={styles.territory} aria-label="Alcance territorial del programa">
          <h3><span className={styles.territoryNumber}>10</span> departamentos</h3>
          <p>Territorios prioritarios</p>
          <ul>
            <li>Guatemala</li>
            <li>Quiché</li>
            <li>Quetzaltenango</li>
            <li>Sololá</li>
          </ul>
        </aside>
      </section>
      <section className={styles.reportInvite} aria-labelledby="report-invite-title">
        <div className={styles.inviteArt} aria-hidden="true">
          <Image src={reportIllustration} alt="" sizes="(max-width: 720px) 260px, 380px" />
        </div>
        <div className={styles.inviteCopy}>
          <h2 id="report-invite-title">Documenta una situación de violencia política.</h2>
          <p>Comparte una captura y describe lo ocurrido. No necesitas una cuenta.</p>
          <Link className={styles.primary} href="/reportar">
            Enviar un reporte <Arrow />
          </Link>
          <Link className={styles.inviteTutorial} href="/reportar#tutorial">
            ¿No sabes cómo? Aprende a enviar un reporte
          </Link>
        </div>
      </section>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <h2 id="catalog-title">Reportes publicados</h2>
        <Link className={styles.inverse} href="/reportes">
          Ver el catálogo <Arrow />
        </Link>
      </section>
      <section className={styles.logos} aria-label="Organizaciones del proyecto">
        <ul className={styles.logoGrid}>
          {projectLogos.map((logo) => (
            <li key={logo.id}>
              {logo.href ? (
                <a href={logo.href} target="_blank" rel="noopener noreferrer" aria-label={`${logo.name} (abre en otra pestaña)`}>
                  <Image src={logo.image} alt="" sizes="(max-width: 720px) 140px, 200px" />
                </a>
              ) : (
                <span className={styles.logoImage}>
                  <Image src={logo.image} alt={logo.name} sizes="(max-width: 720px) 140px, 200px" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
