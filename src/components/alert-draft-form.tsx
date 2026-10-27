"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AlertContext,
  AlertDraft,
  AlertSource,
} from "@/lib/alert-contract";
import { send } from "./api";
import { AlertGenerationForm } from "./alert-generation-form";
export function AlertDraftForm({
  id,
  reportVersion,
  context,
  aiReady,
}: {
  id: string;
  reportVersion: number;
  context: AlertContext;
  aiReady: boolean;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [baseReportVersion, setBaseReportVersion] = useState(reportVersion);
  const [draft, setDraft] = useState(context.draft);
  const [title, setTitle] = useState(context.draft?.title ?? "");
  const [body, setBody] = useState(context.draft?.body ?? "");
  const [source, setSource] = useState<AlertSource | null>(
    context.draft?.source ?? null,
  );
  const [writing, setWriting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState("");
  const busy = !ready || writing || refreshing || generating;
  const unchanged =
    !!draft &&
    title === draft.title &&
    body === draft.body &&
    JSON.stringify(source) === JSON.stringify(draft.source);
  const hasChanges = draft ? !unchanged : !!(title || body || source);
  useEffect(() => {
    if (hasChanges || busy) return;
    setBaseReportVersion(reportVersion);
    setDraft(context.draft);
    setTitle(context.draft?.title ?? "");
    setBody(context.draft?.body ?? "");
    setSource(context.draft?.source ?? null);
  }, [reportVersion, context.draft, hasChanges, busy]);
  return (
    <section className="form-panel" aria-labelledby="alert-draft-heading">
      <h2 id="alert-draft-heading">Borrador de alerta</h2>
      <p className="help">Documento interno; no se envía ni se publica.</p>
      {draft && (
        <p className="help">
          {draft.editor_username} ·{" "}
          {new Intl.DateTimeFormat("es-GT", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "America/Guatemala",
          }).format(new Date(draft.updated_at))}
        </p>
      )}
      <AlertGenerationForm
        id={id}
        reportVersion={baseReportVersion}
        draftVersion={draft?.version ?? 0}
        latest={context.generation}
        ready={aiReady}
        disabled={writing || refreshing}
        onBusy={setGenerating}
        onUse={(job) => {
          if (!job.result) return;
          if (
            (title.trim() || body.trim()) &&
            !window.confirm(
              "¿Reemplazar el título y el texto por esta propuesta?",
            )
          )
            return;
          setTitle(job.result.title);
          setBody(job.result.body);
          setSource({ kind: "generated", id: job.id });
          setError("");
        }}
      />
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setWriting(true);
          setError("");
          try {
            const saved: AlertDraft = await send(
              `/api/privado/registros/${id}/borrador-alerta`,
              {
                title,
                body,
                reportVersion: baseReportVersion,
                draftVersion: draft?.version ?? 0,
                source,
              },
            );
            setDraft(saved);
            setTitle(saved.title);
            setBody(saved.body);
            setSource(saved.source);
            startTransition(() => router.refresh());
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setWriting(false);
          }
        }}
      >
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="alert-title">Título de alerta</label>
          <input
            id="alert-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={5}
            maxLength={160}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="alert-body">Texto de alerta</label>
          <textarea
            id="alert-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            minLength={20}
            maxLength={6000}
            rows={6}
            disabled={busy}
          />
        </div>
        {context.base && (
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                body.trim() &&
                !window.confirm(
                  "¿Reemplazar el texto de alerta por el resumen de IA?",
                )
              )
                return;
              setBody(context.base!.summary);
              setSource(context.base!.source);
              setError("");
            }}
          >
            Usar resumen de IA
          </button>
        )}
        <button className="button" disabled={busy || unchanged}>
          {busy ? "Guardando…" : "Guardar borrador"}
        </button>
      </form>
    </section>
  );
}
