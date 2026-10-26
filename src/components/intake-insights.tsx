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
      <span className="eyebrow">Preparado al recibir el reporte</span>
      <h2>Análisis inicial de IA</h2>
      <p className="help">
        Evaluación preliminar de descripción y captura. No demuestra veracidad
        ni autenticidad y no sustituye tu revisión.
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
            {analysis.model && (
              <p className="help">
                {analysis.transport === "simulation"
                  ? "Proveedor simulado"
                  : "OpenAI"}{" "}
                · {analysis.model}
              </p>
            )}
            {result && analysis.state === "completed" ? (
              <>
                <h3>Pertinencia preliminar</h3>
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
                <p className="help">
                  Categorías orientativas. La clasificación humana se registra
                  al validar.
                </p>
                <h3>Resumen inicial</h3>
                <p>{result.summary}</p>
                <h3>Observaciones sobre la captura</h3>
                <p>{result.evidenceNotes}</p>
                <h3>Puntos para la revisora</h3>
                <ul>
                  {result.observations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <h3>Información que falta</h3>
                {result.missingInformation.length ? (
                  <ul>
                    {result.missingInformation.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No se señalaron faltantes; esto no significa que el relato
                    esté verificado.
                  </p>
                )}
                <p className="notice">{result.limitations}</p>
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
            Este registro no tiene un análisis automático inicial. Los registros
            anteriores conservan su revisión manual.
          </p>
        )}
      </div>
    </section>
  );
}
