"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./api";
export function ValidationForm({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <section className="form-panel">
      <span className="eyebrow">Revisión humana</span>
      <h2>Validar internamente</h2>
      <p>
        Confirma que revisaste el contexto del registro. Esta decisión deja
        constancia de la revisión interna y no acredita judicialmente los
        hechos.
      </p>
      <p className="notice">
        Validar mantiene el registro privado. La publicación requiere preparar y
        aprobar una versión pública por separado.
      </p>
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if (
            !window.confirm(
              "¿Validar internamente este registro? Se guardarán tu usuario y la fecha. No se publicará contenido.",
            )
          )
            return;
          setBusy(true);
          setError("");
          try {
            await send(`/api/privado/registros/${id}/validacion`, {
              confirmed,
              version,
            });
            router.refresh();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <label className="checkbox">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>Revisé la información y confirmo esta validación interna.</span>
        </label>
        <button className="button" disabled={busy || !confirmed}>
          {busy ? "Validando…" : "Validar sin publicar"}
        </button>
      </form>
    </section>
  );
}
