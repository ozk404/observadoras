import { requireUser } from "@/server/auth";
import { DraftForm } from "@/components/private-forms";
export default async function New() {
  await requireUser();
  return (
    <div className="reading">
      <span className="eyebrow">Registro interno</span>
      <h1>Nuevo hallazgo</h1>
      <p>
        Guarda tu avance como borrador privado. Envíalo cuando esté listo para
        revisión.
      </p>
      <section className="form-panel">
        <DraftForm />
      </section>
    </div>
  );
}
