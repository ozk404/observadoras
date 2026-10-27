"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicationForm } from "./private-forms";
import { send } from "./api";
import {
  categoryLabels,
  analysisErrorLabels,
  type AnalysisView,
} from "@/lib/ai-contract";
import { sensitiveSignals, redactCommonIdentifiers } from "@/lib/privacy";
export function AiReview({
  id,
  version,
  analyses,
  ready,
  simulation,
  editable = true,
  canPublish = false,
}: {
  id: string;
  version: number;
  analyses: AnalysisView[];
  ready: boolean;
  simulation: boolean;
  editable?: boolean;
  canPublish?: boolean;
}) {
  const [text, setText] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publicDraft, setPublicDraft] = useState<{ text: string; key: number }>(
    { text: "", key: 0 },
  );
  const router = useRouter();
  const signals = sensitiveSignals(text);
  const latest = analyses[0];
  const running =
    busy ||
    (latest?.status === "running" &&
      Date.now() - new Date(latest.created_at).getTime() < 120000);
  return (
    <div className="review-assistance">
      {(editable || analyses.length > 0) && (
        <details className="extra-analysis" open={analyses.length > 0}>
          <summary>Análisis adicional de IA</summary>
          <section className="form-panel ai-panel">
            <h2>Sugerencias de IA</h2>
            <p>
              Analiza otro texto preparado por ti. El original no se envía
              automáticamente.
            </p>
            {editable && !ready && (
              <p className="notice" role="status">
                El análisis adicional no está disponible. Puedes continuar
                manualmente.
              </p>
            )}
            {simulation && (
              <p className="notice">
                Entorno de prueba: proveedor simulado, sin llamadas a OpenAI.
              </p>
            )}
            {editable && ready && (
              <form
                className="form-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  if (signals.length) {
                    setError("Revisa y depura las señales antes de enviar.");
                    return;
                  }
                  setBusy(true);
                  try {
                    await send(`/api/privado/registros/${id}/analisis`, {
                      text,
                      version,
                      privacyConfirmed: privacy,
                    });
                    router.refresh();
                  } catch (error) {
                    setError((error as Error).message);
                    router.refresh();
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
                  <label htmlFor="ai-text">Texto preparado para IA</label>
                  <p id="ai-help" className="help">
                    Elimina nombres, contactos, enlaces y detalles que permitan
                    identificar a alguien. La detección de señales es
                    orientativa y no garantiza anonimización.
                  </p>
                  <textarea
                    id="ai-text"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setPrivacy(false);
                    }}
                    required
                    minLength={20}
                    maxLength={6000}
                    rows={6}
                    aria-describedby="ai-help ai-signals"
                  />
                </div>
                <div id="ai-signals" aria-live="polite">
                  {signals.length > 0 ? (
                    <>
                      <p className="error">
                        Señales detectadas: {signals.join(", ")}.
                      </p>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setText(redactCommonIdentifiers(text));
                          setPrivacy(false);
                        }}
                      >
                        Depurar identificadores comunes
                      </button>
                    </>
                  ) : (
                    text && (
                      <p className="help">
                        Sin identificadores comunes detectados. Revisa también
                        nombres, territorio y contexto.
                      </p>
                    )
                  )}
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={privacy}
                    required
                    onChange={(e) => setPrivacy(e.target.checked)}
                  />
                  <span>
                    Revisé este texto y su contexto; no contiene información
                    identificable ni datos que no puedan enviarse.
                  </span>
                </label>
                <button
                  className="button"
                  disabled={!ready || running || signals.length > 0}
                >
                  {running ? "Preparando sugerencia…" : "Solicitar sugerencias"}
                </button>
              </form>
            )}
            <div className="ai-results" aria-live="polite">
              {analyses.map((analysis) => (
                <article className="ai-result" key={analysis.id}>
                  <span className="status">
                    {analysis.transport === "simulation"
                      ? "Simulación de IA"
                      : "Sugerencia de IA"}{" "}
                    {analysis.superseded_at
                      ? "— anterior a los ajustes; no vigente"
                      : "— pendiente de revisión"}
                  </span>
                  <p className="help">
                    {new Date(analysis.created_at).toLocaleString("es-GT", {
                      timeZone: "America/Guatemala",
                    })}
                  </p>
                  {analysis.status === "succeeded" && analysis.result ? (
                    <>
                      <h3>Categorías orientativas</h3>
                      <p>
                        {analysis.result.categories
                          .map((key) => categoryLabels[key])
                          .join(" · ")}
                      </p>
                      <h3>Resumen interno sugerido</h3>
                      <p className="report-body">{analysis.result.summary}</p>
                      <h3>Límites del resultado</h3>
                      <p>{analysis.result.limitations}</p>
                      {canPublish && !analysis.superseded_at && (
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Llevar este resumen al borrador público? Reemplazará el texto que estés preparando y tendrás que revisarlo antes de publicar.",
                              )
                            )
                              setPublicDraft((draft) => ({
                                text: analysis.result!.summary,
                                key: draft.key + 1,
                              }));
                          }}
                        >
                          Usar resumen como borrador público
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="notice">
                      {analysis.status === "running"
                        ? Date.now() - new Date(analysis.created_at).getTime() <
                          120000
                          ? "Hay una solicitud en curso. Recarga en unos momentos; la revisión manual sigue disponible."
                          : "La solicitud anterior venció. Puedes solicitar sugerencias de nuevo o continuar manualmente."
                        : analysisErrorLabels[
                            analysis.error_code ?? "unavailable"
                          ]}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </details>
      )}
      {canPublish && (
        <section className="form-panel">
          <h2>Preparar versión pública</h2>
          <p>
            Solo el título y el texto que apruebes serán públicos. La captura y
            el original permanecen privados.
          </p>
          <PublicationForm
            id={id}
            version={version}
            initialBody={publicDraft.text}
            bodyRevision={publicDraft.key}
          />
        </section>
      )}
    </div>
  );
}
