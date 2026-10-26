import Link from "next/link";
import { Arrow, Shield } from "@/components/icons";
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="small-rule" />
            Monitoreo ciudadano con perspectiva de género
          </span>
          <h1>
            La participación
            <br />
            de las mujeres
            <br />
            <em>
              merece un espacio
              <br />
              sin violencia.
            </em>
          </h1>
          <p>
            Documentamos situaciones de violencia política digital,
            desinformación y barreras a la participación. Tu relato puede
            contribuir a hacerlas visibles.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/reportar">
              Enviar un reporte <Arrow />
            </Link>
            <Link className="inline-link" href="/reportes">
              Explorar reportes revisados <Arrow />
            </Link>
          </div>
          <div className="hero-note">
            <Shield />
            <span>
              Sin crear una cuenta.
              <br />
              <strong>Con revisión humana antes de publicar.</strong>
            </span>
          </div>
        </div>
        <aside className="hero-panel" aria-label="Nuestro proceso">
          <span className="eyebrow">Del relato a la visibilidad</span>
          <div className="panel-statement">
            Escuchar.
            <br />
            Cuidar.
            <br />
            <span>Hacer visible.</span>
          </div>
          <p>
            Cada relato merece atención.
            <br />
            Cada publicación, una revisión responsable.
          </p>
          <div className="panel-bottom">
            <span>
              Una iniciativa de
              <br />
              <strong>Fundación Oxlajuj No’j</strong>
            </span>
            <span className="panel-year">2026</span>
          </div>
        </aside>
      </section>
      <section className="process-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Cómo funciona</span>
              <h2>
                Tu voz inicia el proceso.
                <br />
                El cuidado guía cada paso.
              </h2>
            </div>
            <p>
              El envío es privado. Solo una versión revisada y aprobada por el
              equipo puede hacerse pública.
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                "01",
                "Comparte lo ocurrido",
                "Describe la situación sin incluir datos personales innecesarios. No necesitas una cuenta.",
              ],
              [
                "02",
                "Revisamos con cuidado",
                "El equipo del observatorio examina el relato y prepara una versión que proteja a las personas.",
              ],
              [
                "03",
                "Visibilizamos lo aprobado",
                "El catálogo reúne únicamente las versiones expresamente aprobadas para publicación.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span className="step-number">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="wrap closing">
        <div>
          <span className="eyebrow">Reportes revisados</span>
          <h2>
            Conocer también es
            <br />
            una forma de participar.
          </h2>
          <p>
            Consulta las versiones públicas aprobadas por el equipo del
            observatorio.
          </p>
        </div>
        <Link className="button secondary" href="/reportes">
          Ver el catálogo <Arrow />
        </Link>
      </section>
    </>
  );
}
