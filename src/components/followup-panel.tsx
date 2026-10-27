"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FollowupEntry } from "@/lib/followup-contract";
import { send } from "./api";
export function FollowupPanel({
  id,
  version,
  entries,
}: {
  id: string;
  version: number;
  entries: FollowupEntry[];
}) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState("");
  const [writing, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = writing || refreshing;
  const [error, setError] = useState("");
  const closed = entries.some((entry) => entry.kind === "closed");
  return (
    <section className="form-panel" aria-labelledby="followup-heading">
      <h2 id="followup-heading">Seguimiento</h2>
      <p className="help">
        Las notas son privadas. Cerrar conserva la publicación.
      </p>
      {closed && <span className="status">Cerrado</span>}
      {entries.map((entry) => (
        <article className="adjustment-entry" key={entry.id}>
          {entry.kind === "closed" && <h3>Cierre del seguimiento</h3>}
          <p className="report-body">{entry.note}</p>
          <p className="help">
            {entry.reviewer_username} ·{" "}
            {new Intl.DateTimeFormat("es-GT", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Guatemala",
            }).format(new Date(entry.created_at))}
          </p>
        </article>
      ))}
      {!closed && (
        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              closing &&
              !window.confirm(
                "¿Cerrar el seguimiento? La publicación se conserva.",
              )
            )
              return;
            setBusy(true);
            setError("");
            try {
              await send(`/api/privado/registros/${id}/seguimiento`, {
                action: closing ? "close" : "note",
                note,
                version,
                ...(closing ? { confirmed: true } : {}),
              });
              setNote("");
              setClosing(false);
              startTransition(() => router.refresh());
            } catch (error) {
              setError((error as Error).message);
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
            <label htmlFor="followup-note">
              {closing ? "Motivo del cierre" : "Nota"}
            </label>
            <textarea
              id="followup-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              disabled={busy}
            />
          </div>
          <button className="button" disabled={busy}>
            {busy
              ? "Guardando…"
              : closing
                ? "Confirmar cierre"
                : "Guardar nota"}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              setClosing(!closing);
              setNote("");
              setError("");
            }}
          >
            {closing ? "Cancelar" : "Cerrar seguimiento"}
          </button>
        </form>
      )}
    </section>
  );
}
