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
import { ReportOperations } from "@/components/report-operations";
import { getAlertContext } from "@/server/alert-drafts";
import { EvidencePreview } from "@/components/evidence-preview";
import { publicImageContext } from "@/server/publication-images";
import { PublicImagePanel } from "@/components/public-image-panel";
import styles from "./detail.module.css";
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
  const imageContext =
    user.role === "reviewer" && report.status === "published"
      ? await publicImageContext(report.id)
      : null;
  const date = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guatemala",
  });
  const editable =
    ["draft", "needs_adjustments"].includes(report.status) &&
    report.author_id === user.id;
  return (
    <div className={styles.page}>
      <Link href="/equipo" className={styles.back}>
        ← Reportes
      </Link>
      <header className={styles.header}>
        <div className={styles.meta}>
          <Status status={report.status} />
          <span>
            {report.author_id ? "Registro interno" : "Envío sin cuenta"}
          </span>
          <time dateTime={report.created_at.toISOString()}>
            {date.format(report.created_at)}
          </time>
        </div>
        <h1>{report.title}</h1>
      </header>
      <nav className={styles.sections} aria-label="Secciones del reporte">
        <a href="#reporte">Reporte</a>
        {user.role === "reviewer" &&
          !editable &&
          (report.status === "pending" || report.validated_at) && (
            <a href="#revision">
              {report.status === "pending"
                ? "Revisión"
                : "Resultado de revisión"}
            </a>
          )}
        {report.status === "validated" && user.role === "reviewer" && (
          <a href="#publicacion">Publicación</a>
        )}
        {adjustments.length > 0 && <a href="#ajustes">Ajustes</a>}
        {canFollowup && (
          <>
            <a href="#seguimiento">Seguimiento</a>
            <a href="#alerta">Alerta</a>
          </>
        )}
      </nav>
      {adjustments.length > 0 && (
        <section
          className={styles.history}
          id="ajustes"
          aria-label="Ajustes solicitados"
        >
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
                {date.format(adjustment.requested_at)}
              </p>
              <p className="report-body">{adjustment.note}</p>
              {adjustment.resolved_at && (
                <p className="help">
                  Reenvío: {date.format(adjustment.resolved_at)}. Pendiente de
                  revisión del ajuste.
                </p>
              )}
            </article>
          ))}
        </section>
      )}
      {editable ? (
        <section id="reporte" className={styles.editPanel}>
          <h2>{corrections ? "Corregir y reenviar" : "Editar borrador"}</h2>
          {corrections && <p>Al reenviar, el reporte vuelve a revisión.</p>}
          <DraftForm report={report} corrections={corrections} />
        </section>
      ) : (
        <>
          <div className={styles.overview} id="reporte">
            <section
              className={styles.original}
              aria-labelledby="original-title"
              tabIndex={0}
            >
              <div className={styles.panelHeading}>
                <h2 id="original-title">Reporte recibido</h2>
                <span className={styles.private}>Privado</span>
              </div>
              {report.has_evidence && (
                <EvidencePreview
                  id={report.id}
                  title={report.title}
                  available
                  large
                />
              )}
              <div className={styles.description}>
                <h3>Descripción</h3>
                <div className="report-body">{report.description}</div>
              </div>
              {report.source_url && (
                <a
                  className={styles.source}
                  href={report.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Ver publicación original ↗<span>{report.source_url}</span>
                </a>
              )}
            </section>
            {user.role === "reviewer" ? (
              <IntakeInsights
                id={report.id}
                version={report.version}
                canRetry={report.status === "pending"}
              />
            ) : (
              <aside className={styles.participant}>
                <h2>Estado del reporte</h2>
                <p>
                  {report.status === "published"
                    ? "Se aprobó una versión pública de este reporte."
                    : report.status === "validated"
                      ? "La revisión interna terminó. El original sigue privado."
                      : "El equipo está revisando este reporte."}
                </p>
              </aside>
            )}
          </div>
          {report.validated_at && (
            <section
              className={styles.reviewResult}
              id="revision"
              aria-labelledby="decision-title"
            >
              <div>
                <span className={styles.kicker}>Revisión humana</span>
                <h2 id="decision-title">
                  {report.validation_source === "legacy_publication"
                    ? "Revisión registrada al publicar"
                    : "Validación interna registrada"}
                </h2>
                <p>
                  Por {report.validator_username} ·{" "}
                  {date.format(report.validated_at)}
                </p>
              </div>
              <div>
                {report.reviewed_categories.length > 0 && (
                  <div className={styles.tags}>
                    {report.reviewed_categories.map((key) => (
                      <span key={key}>
                        {categoryLabels[key as keyof typeof categoryLabels] ??
                          key}
                      </span>
                    ))}
                  </div>
                )}
                {report.review_observation && (
                  <p className="report-body">{report.review_observation}</p>
                )}
              </div>
            </section>
          )}
          {user.role === "reviewer" && (
            <>
              {report.status === "pending" && (
                <div className={styles.decision} id="revision">
                  <ValidationForm id={report.id} version={report.version} />
                  {report.author_id && (
                    <details className={styles.disclosure}>
                      <summary>Solicitar correcciones a la autora</summary>
                      <AdjustmentForm id={report.id} version={report.version} />
                    </details>
                  )}
                </div>
              )}
              {corrections && (
                <p className="notice">
                  La autora debe reenviar sus correcciones antes de continuar la
                  revisión.
                </p>
              )}
              <div id="publicacion" className={styles.publication}>
                <AiReview
                  id={report.id}
                  version={report.version}
                  analyses={analyses}
                  ready={ready}
                  simulation={simulation}
                  editable={report.status === "pending"}
                  canPublish={report.status === "validated"}
                />
              </div>
              {imageContext && (
                <div className={styles.publication}>
                  <PublicImagePanel
                    key={report.id}
                    id={report.id}
                    context={imageContext}
                  />
                </div>
              )}
              {canFollowup && (
                <ReportOperations
                  key={report.id}
                  id={report.id}
                  version={report.version}
                  entries={followup}
                  alertContext={alertContext}
                  aiReady={ready}
                  className={styles.operations}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
