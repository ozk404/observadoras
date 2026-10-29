"use client";
import { AI_CONSENT_VERSION } from "@/lib/consent";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { MAX_EVIDENCE_BYTES, EVIDENCE_TYPES } from "@/lib/evidence";
import { Arrow } from "./icons";
import { ReportTour } from "./report-tour";
export function PublicForm({ heading }: { heading: ReactNode }) {
  const [token, setToken] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const key = useRef("");
  const feedback = useRef<HTMLDivElement>(null);
  const evidenceInput = useRef<HTMLInputElement>(null);
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
  function synchronizeFile(file: File | null) {
    if (!evidenceInput.current) return;
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    evidenceInput.current.files = transfer.files;
  }
  function selectImage(files: FileList | null) {
    if (busy) return;
    if (!files?.length) {
      synchronizeFile(image);
      return;
    }
    const candidate = files[0];
    if (files.length !== 1) {
      setUploadError("Adjunta una sola imagen.");
      synchronizeFile(image);
      return;
    }
    if (
      candidate.size > MAX_EVIDENCE_BYTES ||
      !EVIDENCE_TYPES.includes(candidate.type) ||
      !candidate.size
    ) {
      setUploadError("Usa una imagen PNG, JPG o WebP de hasta 5 MB.");
      synchronizeFile(image);
      return;
    }
    synchronizeFile(candidate);
    setImage(candidate);
    setPreview(URL.createObjectURL(candidate));
    setUploadError("");
    setFields((previous) => ({ ...previous, evidence: [] }));
  }
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
      data.set("consentVersion", AI_CONSENT_VERSION);
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
      <>
        <div className="report-form-heading">{heading}</div>
        <div className="confirmation" ref={feedback} tabIndex={-1}>
          <h2>Tu reporte fue recibido.</h2>
          <p>
            El equipo del observatorio revisará el reporte. El original
            permanece privado; enviarlo no lo publica.
          </p>
          <p>No hay seguimiento público individual en esta etapa.</p>
          <a className="button" href="/">
            Volver al inicio <Arrow />
          </a>
        </div>
      </>
    );
  return (
    <form
      onSubmit={submit}
      className="form-stack"
      encType="multipart/form-data"
    >
      <div className="report-form-heading">
        {heading}
        <ReportTour disabled={busy} />
      </div>
      {failure && (
        <div role="alert" tabIndex={-1} ref={feedback} className="error">
          {failure}
        </div>
      )}
      <div className="report-fields">
        <div className="evidence-upload">
          <label htmlFor="evidence" className="capture-label">
            Captura o imagen <span>(obligatoria)</span>
          </label>
          <div
            data-report-tour="capture"
            className={`capture-surface${dragging ? " is-dragging" : ""}${preview ? " has-image" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!busy) {
                dragDepth.current++;
                setDragging(true);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = busy ? "none" : "copy";
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (!dragDepth.current) setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              selectImage(event.dataTransfer.files);
            }}
          >
            {preview ? (
              <div className="capture-preview">
                <img
                  src={preview}
                  alt="Vista previa de la imagen que vas a enviar"
                />
              </div>
            ) : (
              <>
                <div className="capture-symbol" aria-hidden="true">
                  <svg viewBox="0 0 80 80" fill="none">
                    <rect
                      x="13"
                      y="10"
                      width="50"
                      height="58"
                      rx="8"
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <rect
                      x="23"
                      y="20"
                      width="30"
                      height="25"
                      rx="4"
                      fill="#EADCF2"
                    />
                    <circle cx="32" cy="28" r="3" fill="currentColor" />
                    <path
                      d="m25 40 8-8 7 7 5-5 6 6M24 54h20M24 60h13"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="61" cy="59" r="16" fill="currentColor" />
                    <path
                      d="M61 67V51m-6 6 6-6 6 6"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2>Comparte una captura de lo ocurrido</h2>
                <p className="drop-instruction">
                  Arrastra tu imagen aquí o selecciónala desde tu dispositivo.
                </p>
              </>
            )}
            <div className="capture-controls">
              <div className="file-picker">
                <span aria-hidden="true">
                  {preview ? "Cambiar imagen" : "Seleccionar imagen"} <Arrow />
                </span>
                <input
                  ref={evidenceInput}
                  id="evidence"
                  name="evidence"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  aria-describedby="evidence-help evidence-error"
                  aria-invalid={!!uploadError || !!fields.evidence?.length}
                  disabled={busy}
                  onChange={(event) => selectImage(event.target.files)}
                />
              </div>
              {preview && (
                <button
                  type="button"
                  className="remove-evidence"
                  disabled={busy}
                  onClick={() => {
                    synchronizeFile(null);
                    setImage(null);
                    setPreview("");
                    setUploadError("");
                    evidenceInput.current?.focus();
                  }}
                >
                  Quitar imagen
                </button>
              )}
            </div>
            <p className="capture-limits">
              PNG, JPG o WebP · Hasta 5 MB · Máximo 20 megapíxeles
            </p>
          </div>
          <p id="evidence-help" className="help capture-help">
            Oculta datos personales innecesarios antes de adjuntarla.
          </p>
          <p
            id="evidence-error"
            className="field-error"
            role={uploadError ? "alert" : undefined}
          >
            {uploadError || fields.evidence?.[0]}
          </p>
        </div>
        <div className="report-details">
          <div data-report-tour="url">
            <label htmlFor="sourceUrl">
              URL de la publicación o fuente <span>(opcional)</span>
            </label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              maxLength={2048}
              placeholder="https://…"
              aria-describedby="sourceUrl-error"
              aria-invalid={!!fields.sourceUrl}
            />
            <FieldError name="sourceUrl" fields={fields} />
          </div>
          <div data-report-tour="description" className="report-description">
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
              rows={6}
              aria-describedby="description-help description-error"
              aria-invalid={!!fields.description}
              placeholder="Describe los hechos que deseas compartir con el observatorio…"
            />
            <FieldError name="description" fields={fields} />
            <span className="help">Entre 20 y 6000 caracteres.</span>
          </div>
        </div>
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
      <div className="report-submit-row">
        <label className="checkbox" data-report-tour="consent">
          <input type="checkbox" name="consent" required />
          <span>
            Acepto el{" "}
            <a href="/privacidad" target="_blank" rel="noreferrer">
              aviso de tratamiento de información
            </a>
            . Autorizo el análisis de la descripción y la captura con OpenAI
            para apoyar la revisión del equipo. El envío comienza en privado;
            publicar una versión del texto o una copia de la captura requiere
            aprobación expresa del equipo.
          </span>
        </label>
        <div className="form-actions">
          <button
            className="button"
            data-report-tour="submit"
            disabled={busy || !token}
          >
            {busy ? "Enviando…" : "Enviar a revisión"} <Arrow />
          </button>
        </div>
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
