import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { LoginForm } from "@/components/private-forms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Acceso del equipo",
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await currentUser()) redirect("/equipo");
  return (
    <div className="wrap login-layout page-space">
      <div>
        <span className="eyebrow">Área privada</span>
        <h1>
          Un espacio de trabajo.
          <br />
          Una responsabilidad
          <br />
          <em>compartida.</em>
        </h1>
        <p>Acceso exclusivo para cuentas habilitadas por la administración.</p>
      </div>
      <section className="form-panel">
        <h2>Ingresar al observatorio</h2>
        <p className="help">
          Utiliza las credenciales que te fueron asignadas.
        </p>
        <LoginForm />
      </section>
    </div>
  );
}
