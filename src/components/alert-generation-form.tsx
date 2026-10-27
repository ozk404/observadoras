"use client";
import { useEffect, useState } from "react";
import { send } from "./api";
import { analysisErrorLabels } from "@/lib/ai-contract";
import type { AlertGenerationView } from "@/lib/alert-contract";
export function AlertGenerationForm({
  id,
  reportVersion,
  draftVersion,
  latest,
  ready,
  disabled,
  onBusy,
  onUse,
}: {
  id: string;
  reportVersion: number;
  draftVersion: number;
  latest: AlertGenerationView | null;
  ready: boolean;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onUse: (job: AlertGenerationView) => void;
}) {
  const [job, setJob] = useState(latest);
  const [text, setText] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setJob(latest);
  }, [latest]);
  useEffect(() => {
    if (job?.status !== "running") return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    async function load() {
      try {
        const response = await fetch(
          `/api/privado/registros/${id}/generacion-alerta`,
          { cache: "no-store" },
        );
        if (!response.ok) throw Error();
        const value = await response.json();
        if (disposed) return;
        setJob(value);
        if (value?.status === "running" && polls++ < 85)
          timer = setTimeout(load, 1500);
      } catch {
        if (!disposed)
          setError(
            "No se pudo actualizar la propuesta. Recarga para consultarla.",
          );
      }
    }
    timer = setTimeout(load, 1500);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [id, job?.id, job?.status]);
  const current =
    job?.report_version === reportVersion &&
    job?.draft_version === draftVersion;
  return (
    <section aria-label="Generación de alerta con IA">
      <details open={!!latest}>
        <summary>Generar con IA</summary>
        {ready ? (
          <form
            className="form-stack"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              onBusy(true);
              setError("");
              try {
                setJob(
                  await send(`/api/privado/registros/${id}/generacion-alerta`, {
                    text,
                    privacyConfirmed: privacy,

                    reportVersion,
                    draftVersion,
                  }),
                );
              } catch (error) {
                setError((error as Error).message);
                try {
                  const response = await fetch(
                    `/api/privado/registros/${id}/generacion-alerta`,
                    { cache: "no-store" },
                  );
                  if (response.ok) setJob(await response.json());
                } catch {}
              } finally {
                setBusy(false);
                onBusy(false);
              }
            }}
          >
            <div>
              <label htmlFor="alert-prepared-text">
                Texto para generar la alerta
              </label>
              <textarea
                id="alert-prepared-text"
                value={text}
                required
                minLength={20}
                maxLength={6000}
                rows={4}
                disabled={busy || disabled}
                onChange={(event) => {
                  setText(event.target.value);
                  setPrivacy(false);

                  setError("");
                }}
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                required
                checked={privacy}
                disabled={busy || disabled}
                onChange={(event) => setPrivacy(event.target.checked)}
              />
              <span>Revisé el texto y no contiene datos identificables.</span>
            </label>
            <button
              className="button secondary"
              disabled={busy || disabled || !privacy}
            >
              {busy ? "Generando…" : "Solicitar propuesta"}
            </button>
          </form>
        ) : (
          <p className="notice">IA no disponible.</p>
        )}
        <div aria-live="polite">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {job?.status === "running" && (
            <p className="help">Generación en curso.</p>
          )}
          {job?.status === "failed" && (
            <p className="notice">
              {analysisErrorLabels[job.error_code ?? "unavailable"] ??
                "No se pudo generar la propuesta."}
            </p>
          )}
          {job?.status === "succeeded" && job.result && (
            <article className="adjustment-entry">
              <h3>Propuesta de IA</h3>
              <p className="help">
                {job.transport === "simulation"
                  ? "Proveedor simulado"
                  : "OpenAI"}{" "}
              </p>
              <h4>{job.result.title}</h4>
              <p className="report-body">{job.result.body}</p>
              <p className="notice">{job.result.limitations}</p>
              {current ? (
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || disabled}
                  onClick={() => onUse(job)}
                >
                  Usar propuesta
                </button>
              ) : (
                <span className="status">Propuesta anterior</span>
              )}
            </article>
          )}
        </div>
      </details>
    </section>
  );
}
