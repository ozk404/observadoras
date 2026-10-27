"use client";
import { useEffect, useState } from "react";
import {
  assessmentLabels,
  categoryLabels,
  intakeStateLabels,
  intakeErrorLabels,
  type IntakeView,
} from "@/lib/ai-contract";
import { send } from "./api";
export function IntakeInsights({
  id,
  version,
  canRetry,
}: {
  id: string;
  version: number;
  canRetry: boolean;
}) {
  const [analysis, setAnalysis] = useState<IntakeView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    async function load() {
      try {
        const response = await fetch(
          `/api/privado/registros/${id}/analisis-inicial`,
          { cache: "no-store" },
        );
        if (!response.ok) throw Error();
        const data = await response.json();
        if (disposed) return;
        setAnalysis(data);
        setLoaded(true);
        setError("");
        if (
          data &&
          ["queued", "processing"].includes(data.state) &&
          polls++ < 90
        )
          timer = setTimeout(load, 1500);
      } catch {
        if (!disposed) {
          setError(
            "No pudimos actualizar el análisis inicial. Puedes recargar o continuar la revisión manual.",
          );
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, refresh]);
  const result = analysis?.result;
  return (
    <section className="form-panel intake-panel">
      <h2>Análisis inicial de IA</h2>
      <p className="help">
        Sugerencias sobre la descripción y la captura. No verifican los hechos.
      </p>
      <div aria-live="polite">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!loaded ? (
          <p>Consultando análisis…</p>
        ) : analysis ? (
          <>
            <span
              className={`status ${analysis.state === "completed" ? "validated" : ""}`}
            >
              {intakeStateLabels[analysis.state]}
            </span>
            {result && analysis.state === "completed" ? (
              <>
                <h3>¿Corresponde al observatorio?</h3>
                <p>
                  <strong>{assessmentLabels[result.assessment]}</strong>
                </p>
                <p>{result.assessmentReason}</p>
                <h3>Categorías sugeridas</h3>
                <p>
                  {result.categories
                    .map((key) => categoryLabels[key])
                    .join(" · ")}
                </p>
                <h3>Resumen inicial</h3>
                <p>{result.summary}</p>
                <h3>Observaciones sobre la captura</h3>
                <p>{result.evidenceNotes}</p>
                <h3>Qué revisar</h3>
                <ul>
                  {result.observations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                {result.missingInformation.length > 0 && (
                  <>
                    <h3>Información que falta</h3>
                    <ul>
                      {result.missingInformation.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                <details className="analysis-limits">
                  <summary>Límites del análisis</summary>
                  <p>{result.limitations}</p>
                </details>
              </>
            ) : (
              analysis.error_code && (
                <p className="notice">
                  {intakeErrorLabels[analysis.error_code]}
                </p>
              )
            )}
            {canRetry && ["failed", "blocked"].includes(analysis.state) && (
              <button
                className="button secondary"
                onClick={async () => {
                  if (
                    !window.confirm(
                      "¿Reintentar el análisis autorizado de la descripción y la captura? Se enviarán a OpenAI si superan los controles.",
                    )
                  )
                    return;
                  try {
                    await send(
                      `/api/privado/registros/${id}/analisis-inicial`,
                      { confirmed: true, version },
                    );
                    setRefresh((value) => value + 1);
                  } catch (error) {
                    setError((error as Error).message);
                  }
                }}
              >
                Reintentar análisis inicial
              </button>
            )}
          </>
        ) : (
          <p className="notice">
            No hay análisis inicial disponible. Puedes continuar la revisión
            manual.
          </p>
        )}
      </div>
    </section>
  );
}
