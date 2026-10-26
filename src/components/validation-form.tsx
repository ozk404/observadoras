"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./api";
import { categoryKeys, categoryLabels } from "@/lib/ai-contract";
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
  const [categories, setCategories] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
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
              reviewedCategories: categories,
              reviewObservation: observation,
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
        <fieldset className="category-choices">
          <legend>Clasificación de la revisora</legend>
          <p className="help">
            Elige hasta cuatro categorías orientativas. Se guardan como tu
            decisión, separadas de las sugerencias de IA.
          </p>
          {categoryKeys.map((key) => (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                checked={categories.includes(key)}
                disabled={categories.length >= 4 && !categories.includes(key)}
                onChange={(event) => {
                  setCategories((previous) =>
                    event.target.checked
                      ? [...previous, key]
                      : previous.filter((value) => value !== key),
                  );
                  setConfirmed(false);
                }}
              />
              <span>{categoryLabels[key]}</span>
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="review-observation">
            Observación interna de la revisora <span>(opcional)</span>
          </label>
          <textarea
            id="review-observation"
            value={observation}
            maxLength={2000}
            rows={3}
            onChange={(event) => {
              setObservation(event.target.value);
              setConfirmed(false);
            }}
          />
          <p className="help">
            Indica tu valoración sin datos personales innecesarios. No se
            publica.
          </p>
        </div>
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
