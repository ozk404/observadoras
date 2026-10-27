import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { LoginForm } from "@/components/private-forms";
import { Shield } from "@/components/icons";
import styles from "./ingreso.module.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Acceso del equipo",
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await currentUser()) redirect("/equipo");
  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <aside className={styles.identity} aria-label="Observadoras Digitales">
          <Shield />
          <p className={styles.name}>
            <span>Observadoras</span> <span>Digitales.</span>
          </p>
          <div className={styles.arc} aria-hidden="true" />
          <p className={styles.programme}>Programa Paridad 2026</p>
        </aside>
        <section className={styles.access} aria-labelledby="access-title">
          <header>
            <h1 id="access-title">Acceso del equipo</h1>
            <p>Para cuentas habilitadas por la Fundación.</p>
          </header>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}
