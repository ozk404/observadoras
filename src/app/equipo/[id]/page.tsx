import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getReport, listAdjustments } from "@/server/reports";
import { HttpError } from "@/server/security";
import { Status } from "@/components/status";
import { DraftForm } from "@/components/private-forms";
import { AiReview } from "@/components/ai-review";
import { listAnalyses } from "@/server/analyses";
import { aiConfiguration } from "@/server/openai";
import { ValidationForm } from "@/components/validation-form";
import { AdjustmentForm } from "@/components/adjustment-form";
import { IntakeInsights } from "@/components/intake-insights";
import { categoryLabels } from "@/lib/ai-contract";
import { listFollowup } from "@/server/followup";
import { FollowupPanel } from "@/components/followup-panel";
import { getAlertContext } from "@/server/alert-drafts";
import { AlertDraftForm } from "@/components/alert-draft-form";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  let report;
  try {
    report = await getReport(user, (await params).id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const analyses =
    user.role === "reviewer" && report.status !== "draft"
      ? await listAnalyses(user, report.id)
      : [];
  const { ready, simulation } = aiConfiguration();
  const adjustments = await listAdjustments(user, report.id);
  const corrections = report.status === "needs_adjustments";
  const canFollowup =
    user.role === "reviewer" &&
    ["validated", "published"].includes(report.status);
  const followup = canFollowup ? await listFollowup(user, report.id) : [];
  const alertContext = canFollowup
    ? await getAlertContext(user, report.id)
    : null;
  return (
    <>
      <Link href="/equipo" className="back-link">
        ← Volver a los registros
      </Link>
      <div className="page-heading">
        <Status status={report.status} />
        <h1>{report.title}</h1>
        <p>
          Registro original privado. Su contenido no aparece automáticamente en
          el catálogo.
        </p>
      </div>
      {adjustments.length > 0 && (
        <section className="form-panel adjustment-history">
          <span className="eyebrow">Comunicación privada del registro</span>
          <h2>Ajustes solicitados</h2>
          {adjustments.map((adjustment) => (
            <article className="adjustment-entry" key={adjustment.id}>
              <span className="status">
                {adjustment.resolved_at
                  ? "Reenviado por la autora"
                  : "Pendiente de corrección"}
              </span>
              <p className="help">
                Por {adjustment.requester_username} ·{" "}
                {new Intl.DateTimeFormat("es-GT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Guatemala",
                }).format(adjustment.requested_at)}
              </p>
              <p className="report-body">{adjustment.note}</p>
              {adjustment.resolved_at && (
                <p className="help">
                  Reenvío:{" "}
                  {new Intl.DateTimeFormat("es-GT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Guatemala",
                  }).format(adjustment.resolved_at)}
                  . No implica aprobación del ajuste.
                </p>
              )}
            </article>
          ))}
          <p className="help">
            Se muestran como máximo las 10 solicitudes más recientes. Las
            observaciones no se publican.
          </p>
        </section>
      )}
      {["draft", "needs_adjustments"].includes(report.status) &&
      report.author_id === user.id ? (
        <section className="form-panel reading">
          {corrections && (
            <>
              <h2>Corregir y reenviar</h2>
              <p>
                Atiende la observación del equipo. Guardar conserva este estado;
                reenviar devuelve el registro a revisión sin validarlo ni
                publicarlo.
              </p>
            </>
          )}
          <DraftForm report={report} corrections={corrections} />
        </section>
      ) : (
        <div className="review-layout">
          <section className="form-panel">
            <span className="eyebrow">
              Relato original · Acceso restringido
            </span>
            <h2>Información recibida</h2>
            <div className="report-body">{report.description}</div>
            {(report.has_evidence || report.source_url) && (
              <section className="private-evidence">
                <h3>Imagen recibida · Privada</h3>
                {report.has_evidence && (
                  <>
                    <p className="help">
                      Esta imagen es privada. Con el consentimiento del envío, OpenAI
                      la analiza junto con la descripción.
                    </p>
                    <a
                      href={`/api/privado/registros/${report.id}/evidencia`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        className="evidence-preview"
                        src={`/api/privado/registros/${report.id}/evidencia`}
                        alt="Imagen adjunta al reporte"
                      />
                    </a>
                    <a
                      className="inline-link"
                      href={`/api/privado/registros/${report.id}/evidencia`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir imagen ↗
                    </a>
                  </>
                )}
                {report.source_url && (
                  <p>
                    <a
                      href={report.source_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Abrir URL de la fuente ↗
                    </a>
                    <span className="help source-url">{report.source_url}</span>
                  </p>
                )}
              </section>
            )}
            {report.validated_at && (
              <aside className="notice">
                <strong>
                  {report.validation_source === "legacy_publication"
                    ? "Revisión humana registrada al publicar"
                    : "Validación interna registrada"}
                </strong>
                <p>
                  Por {report.validator_username} ·{" "}
                  {new Intl.DateTimeFormat("es-GT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Guatemala",
                  }).format(report.validated_at)}
                </p>
                <span>
                  Esta revisión no equivale a una determinación judicial.
                </span>
                {report.reviewed_categories.length > 0 && (
                  <p>
                    Clasificación de la revisora:{" "}
                    {report.reviewed_categories
                      .map(
                        (key) =>
                          categoryLabels[key as keyof typeof categoryLabels] ??
                          key,
                      )
                      .join(" · ")}
                  </p>
                )}
                {report.review_observation && (
                  <p className="report-body">
                    Observación interna: {report.review_observation}
                  </p>
                )}
              </aside>
            )}
          </section>
          {user.role === "reviewer" ? (
            <div className="review-assistance">
              <IntakeInsights
                id={report.id}
                version={report.version}
                canRetry={report.status === "pending"}
              />
              {report.status === "pending" && (
                <ValidationForm id={report.id} version={report.version} />
              )}
              {report.status === "pending" &&
                (report.author_id ? (
                  <AdjustmentForm id={report.id} version={report.version} />
                ) : (
                  <p className="notice">
                    Este envío no tiene una cuenta asociada. No se pueden
                    solicitar ajustes a su autora desde la plataforma.
                  </p>
                ))}
              {corrections && (
                <p className="notice">
                  El registro espera correcciones de su autora. No se puede
                  validar ni publicar hasta que vuelva a enviarlo a revisión.
                </p>
              )}
              {canFollowup && (
                <FollowupPanel
                  id={report.id}
                  version={report.version}
                  entries={followup}
                />
              )}
              {alertContext && (
                <AlertDraftForm
                  id={report.id}
                  reportVersion={report.version}
                  context={alertContext}
                  aiReady={ready}
                />
              )}
              <AiReview
                id={report.id}
                version={report.version}
                analyses={analyses}
                ready={ready}
                simulation={simulation}
                editable={report.status === "pending"}
                canPublish={report.status === "validated"}
              />
              {report.status === "pending" && (
                <p className="notice">
                  La versión pública se prepara después de validar internamente.
                  Validar no publica el registro.
                </p>
              )}
            </div>
          ) : (
            <aside className="notice">
              {report.status === "published"
                ? "Una versión revisada de este registro fue aprobada para publicación."
                : report.status === "validated"
                  ? "El equipo completó la validación interna. El registro continúa privado hasta aprobar una versión pública."
                  : "Este registro está pendiente de revisión. Solo el equipo autorizado puede prepararlo para publicación."}
            </aside>
          )}
        </div>
      )}
    </>
  );
}
