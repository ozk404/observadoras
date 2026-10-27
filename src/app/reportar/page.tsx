import type { Metadata } from "next";
import { PublicForm } from "@/components/public-form";
import { Shield } from "@/components/icons";
import styles from "./reportar.module.css";
export const metadata: Metadata = { title: "Enviar reporte" };
export default function Reportar() {
  return (
    <div className={`${styles.page} reportar-v2`}>
      <header className={styles.heading}>
        <h1>Enviar un reporte</h1>
        <p>
          Violencia política digital, desinformación y barreras a la
          participación política de las mujeres.
        </p>
      </header>
      <div className={styles.layout}>
        <section className={styles.form} aria-label="Formulario de reporte">
          <PublicForm />
        </section>
        <aside className={styles.context}>
          <Shield />
          <h2>Tu reporte comienza en privado.</h2>
          <p>No pedimos tu nombre ni datos de contacto.</p>
          <div className={styles.divider} />
          <p>
            El equipo revisa el original. Solo una versión aprobada por una
            persona autorizada puede publicarse; la captura y el enlace
            permanecen privados.
          </p>
          <p className={styles.notice}>
            Este envío informa al observatorio; no presenta una denuncia penal
            ni es un servicio de emergencia.
          </p>
        </aside>
      </div>
    </div>
  );
}
