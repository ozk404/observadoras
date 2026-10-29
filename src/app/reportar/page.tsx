import type { Metadata } from "next";
import { PublicForm } from "@/components/public-form";
import { Shield } from "@/components/icons";
import styles from "./reportar.module.css";
export const metadata: Metadata = { title: "Enviar reporte" };
export default function Reportar() {
  return (
    <div className={`${styles.page} reportar-v2`}>
      <div className={styles.layout}>
        <section className={styles.form} aria-label="Formulario de reporte">
          <PublicForm
            heading={
              <header className={styles.heading}>
                <h1>Enviar un reporte</h1>
                <p>
                  Violencia política digital, desinformación y barreras a la
                  participación política de las mujeres.
                </p>
              </header>
            }
          />
        </section>
        <aside className={styles.context}>
          <Shield />
          <h2>Tu reporte comienza en privado.</h2>
          <p>
            No pedimos tu nombre ni datos de contacto. El original queda en el
            área privada; el equipo puede aprobar una versión pública del texto
            y una copia de la captura.
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
