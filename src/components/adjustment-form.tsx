"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./api";
export function AdjustmentForm({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <section className="form-panel">
      <h2>Solicitar ajustes</h2>
      <p>
        Indica a la autora qué necesita aclarar o corregir. La observación será
        privada y no se enviará por correo.
      </p>
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if (
            !window.confirm(
              "¿Devolver este registro a su autora para corrección? Se mantendrá privado y no podrá validarse hasta su reenvío.",
            )
          )
            return;
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await send(`/api/privado/registros/${id}/ajustes`, {
              note: form.get("note"),
              confirmed: form.get("confirmed") === "on",
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
        <div>
          <label htmlFor="adjustment-note">¿Qué debe corregirse?</label>
          <p className="help" id="adjustment-help">
            Sé concreta. Evita añadir nombres, contactos o detalles
            identificables innecesarios.
          </p>
          <textarea
            disabled={!ready || busy}
            id="adjustment-note"
            name="note"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            aria-describedby="adjustment-help"
          />
        </div>
        <label className="checkbox">
          <input
            name="confirmed"
            type="checkbox"
            required
            disabled={!ready || busy}
          />
          <span>
            Confirmo que el registro necesita correcciones de su autora antes de
            continuar la revisión.
          </span>
        </label>
        <button className="button secondary" disabled={!ready || busy}>
          {busy ? "Devolviendo…" : "Devolver para ajustes"}
        </button>
      </form>
    </section>
  );
}
