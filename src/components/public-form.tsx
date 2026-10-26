"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_EVIDENCE_BYTES, EVIDENCE_TYPES } from "@/lib/evidence";
import { Arrow } from "./icons";
export function PublicForm() {
  const [token, setToken] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
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
      const image = data.get("evidence");
      if (!(image instanceof File) || !image.size)
        throw new Error("Adjunta una captura o imagen.");
      if (
        image.size > MAX_EVIDENCE_BYTES ||
        !EVIDENCE_TYPES.includes(image.type)
      )
        throw new Error("Usa una imagen PNG, JPG o WebP de hasta 5 MB.");
      data.set("consent", String(data.get("consent") === "on"));
      data.set("token", token);
      data.set("submissionKey", key.current);
      const response = await fetch("/api/denuncias", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw Object.assign(
          new Error(result.error ?? "No se pudo enviar el reporte."),
          { fields: result.fields },
        );
      setDone(true);
      setPreview("");
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
        <h2>Tu reporte fue recibido.</h2>
        <p>
          El equipo del observatorio podrá revisarla junto con un análisis
          preliminar de IA de la descripción y la captura, cuando esté
          disponible. El envío no publica tu relato.
        </p>
        <p>No hay seguimiento público individual en esta etapa.</p>
        <a className="button" href="/">
          Volver al inicio <Arrow />
        </a>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="form-stack"
      encType="multipart/form-data"
    >
      {failure && (
        <div role="alert" tabIndex={-1} ref={feedback} className="error">
          {failure}
        </div>
      )}
      <div className="evidence-upload">
        <label htmlFor="evidence">
          Captura o imagen <span>(obligatoria)</span>
        </label>
        <p id="evidence-help" className="help">
          Adjunta una captura de pantalla o imagen que documente lo ocurrido.
          Oculta datos personales innecesarios antes de enviarla. PNG, JPG o
          WebP, hasta 5 MB y 20 megapíxeles.
        </p>
        <input
          id="evidence"
          name="evidence"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          aria-describedby="evidence-help"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview("");
            if (file) {
              if (
                file.size > MAX_EVIDENCE_BYTES ||
                !EVIDENCE_TYPES.includes(file.type)
              ) {
                setFailure("Usa una imagen PNG, JPG o WebP de hasta 5 MB.");
                event.target.value = "";
              } else {
                setFailure("");
                setPreview(URL.createObjectURL(file));
              }
            }
          }}
        />
        {preview && (
          <img
            className="evidence-preview"
            src={preview}
            alt="Vista previa de la imagen que vas a enviar"
          />
        )}
      </div>
      <div>
        <label htmlFor="sourceUrl">
          URL de la publicación o fuente <span>(opcional)</span>
        </label>
        <p id="url-help" className="help">
          Pega el enlace completo, si está disponible. Quedará privado para
          revisión.
        </p>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          maxLength={2048}
          placeholder="https://…"
          aria-describedby="url-help sourceUrl-error"
          aria-invalid={!!fields.sourceUrl}
        />
        <FieldError name="sourceUrl" fields={fields} />
      </div>
      <div>
        <label htmlFor="description">
          Descripción de lo ocurrido <span>(obligatoria)</span>
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
        <span className="help">Entre 20 y 6000 caracteres.</span>
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
          Acepto el{" "}
          <a href="/privacidad" target="_blank" rel="noreferrer">
            aviso de tratamiento de información
          </a>
          . Autorizo el análisis de la descripción y la captura con OpenAI para
          apoyar la revisión del equipo. El original y la imagen permanecen privados.
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
