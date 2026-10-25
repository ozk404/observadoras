"use client";
import { useEffect, useRef, useState } from "react";
import { send } from "./api";
import { Arrow } from "./icons";
export function PublicForm() {
  const [token, setToken] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const key = useRef("");
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    key.current = crypto.randomUUID();
    fetch("/api/form-token", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => setToken(d.token))
      .catch(() =>
        setFailure("No pudimos preparar el formulario. Recarga la página."),
      );
  }, []);
  useEffect(() => {
    if (failure || done) feedback.current?.focus();
  }, [failure, done]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure("");
    setFields({});
    const data = new FormData(event.currentTarget);
    try {
      await send("/api/denuncias", {
        title: data.get("title"),
        description: data.get("description"),
        consent: data.get("consent") === "on",
        website: data.get("website"),
        token,
        submissionKey: key.current,
      });
      setDone(true);
    } catch (error) {
      setFailure((error as Error).message);
      setFields((error as { fields?: Record<string, string[]> }).fields ?? {});
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="confirmation" ref={feedback} tabIndex={-1}>
        <span className="eyebrow">Envío completado</span>
        <h2>Tu denuncia fue recibida.</h2>
        <p>
          El equipo del observatorio podrá revisarla. El envío no publica tu
          relato ni constituye una denuncia ante una autoridad.
        </p>
        <p>No hay seguimiento público individual en esta etapa.</p>
        <a className="button" href="/">
          Volver al inicio <Arrow />
        </a>
      </div>
    );
  return (
    <form onSubmit={submit} className="form-stack">
      {failure && (
        <div role="alert" tabIndex={-1} ref={feedback} className="error">
          {failure}
        </div>
      )}
      <div>
        <label htmlFor="title">
          Título breve <span>(obligatorio)</span>
        </label>
        <p id="title-help" className="help">
          Describe la situación sin nombres ni identificadores personales.
        </p>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={160}
          autoComplete="off"
          aria-describedby="title-help title-error"
          aria-invalid={!!fields.title}
          placeholder="Por ejemplo: mensajes que buscan silenciar la participación"
        />
        <FieldError name="title" fields={fields} />
      </div>
      <div>
        <label htmlFor="description">
          ¿Qué ocurrió? <span>(obligatorio)</span>
        </label>
        <p id="description-help" className="help">
          Cuenta el contexto necesario. Evita teléfonos, correos, usuarios,
          enlaces personales y ubicaciones precisas.
        </p>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={6000}
          rows={8}
          aria-describedby="description-help description-error"
          aria-invalid={!!fields.description}
          placeholder="Describe los hechos que deseas compartir con el observatorio…"
        />
        <FieldError name="description" fields={fields} />
        <span className="help">
          Entre 20 y 6000 caracteres. No se admiten archivos adjuntos.
        </span>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Deja este campo vacío</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>
          He leído el{" "}
          <a href="/privacidad" target="_blank" rel="noreferrer">
            aviso de tratamiento de información
          </a>
          . Entiendo que el equipo recibirá este relato de forma privada y que
          cualquier versión pública requiere revisión humana.
        </span>
      </label>
      <div className="form-actions">
        <button className="button" disabled={busy || !token}>
          {busy ? "Enviando…" : "Enviar a revisión"} <Arrow />
        </button>
        <span className="help">No necesitas crear una cuenta.</span>
      </div>
    </form>
  );
}
function FieldError({
  name,
  fields,
}: {
  name: string;
  fields: Record<string, string[]>;
}) {
  return (
    <p id={`${name}-error`} className="field-error">
      {fields[name]?.[0]}
    </p>
  );
}
