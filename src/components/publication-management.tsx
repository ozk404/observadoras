"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./api";
import { PublicationFields } from "./publication-fields";
import { PublicImagePanel } from "./public-image-panel";
import {
  publicationSections,
  type PublicationContext,
} from "@/lib/publication";
import styles from "./publication-management.module.css";

const actions: Record<string, string> = {
  published: "Publicación aprobada",
  corrected: "Corrección aprobada",
  withdrawn: "Publicación retirada",
  republished: "Publicación restablecida",
};
export function PublicationManagement({
  id,
  context,
}: {
  id: string;
  context: PublicationContext;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(context);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [approved, setApproved] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    // Background refreshes must not replace an in-progress correction.
    if (!editing && !removing)
      setCurrent((old) =>
        context.publication.version > old.publication.version ? context : old,
      );
  }, [context, editing, removing]);
  const p = current.publication;
  const withdrawn = Boolean(p.withdrawn_at);
  const locked = busy || !ready;
  const clearApproval = () => {
    setPrivacy(false);
    setApproved(false);
  };
  async function save(method: "PATCH" | "DELETE", body: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result: PublicationContext = await send(
        `/api/privado/registros/${id}/publicacion`,
        body,
        method,
      );
      setCurrent(result);
      setEditing(false);
      setRemoving(false);
      clearApproval();
      setMessage(
        method === "DELETE"
          ? "Publicación retirada del sitio."
          : withdrawn
            ? "Publicación restablecida."
            : "Corrección publicada.",
      );
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const date = (value: string) =>
    new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Guatemala",
    }).format(new Date(value));
  return (
    <div className={styles.stack}>
      <section
        className={`form-panel ${styles.panel}`}
        aria-labelledby="managed-publication-title"
      >
        <header className={styles.header}>
          <h2 id="managed-publication-title">
            {withdrawn ? "Publicación retirada" : "Publicación"}
          </h2>
          {!withdrawn && (
            <a
              className="button secondary"
              href={`/reportes/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver publicación ↗
            </a>
          )}
        </header>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {!editing && (
          <>
            <h3>{p.title}</h3>
            <p className={styles.preview}>{p.body}</p>
          </>
        )}
        {!editing && !removing && (
          <div className={styles.actions}>
            <button
              type="button"
              className="button"
              disabled={locked}
              onClick={() => {
                setError("");
                clearApproval();
                setEditing(true);
              }}
            >
              {withdrawn
                ? "Revisar y volver a publicar"
                : "Corregir publicación"}
            </button>
            {!withdrawn && (
              <button
                type="button"
                className="button secondary"
                disabled={locked}
                onClick={() => {
                  setError("");
                  setRemoving(true);
                }}
              >
                Retirar publicación
              </button>
            )}
          </div>
        )}
        {editing && (
          <form
            key={p.version}
            className="form-stack"
            aria-label="Corregir versión pública"
            onChange={(event) => {
              const name =
                event.target instanceof HTMLInputElement
                  ? event.target.name
                  : "";
              if (!["privacy", "approval"].includes(name)) clearApproval();
            }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const content = {
                title: String(form.get("title")),
                body: String(form.get("body")),
                version: p.version,
                privacyConfirmed: privacy,
                publicationConfirmed: approved,
                categories: form.getAll("public-categories"),
                ...Object.fromEntries(
                  publicationSections.map((field) => [
                    field.key,
                    String(form.get(`public-${field.key}`) ?? ""),
                  ]),
                ),
              };
              void save("PATCH", {
                content,
                restore: withdrawn,
                reason: String(form.get("reason")),
              });
            }}
          >
            <fieldset disabled={locked} className={styles.fields}>
              <div>
                <label htmlFor="managed-title">Título público</label>
                <input
                  id="managed-title"
                  name="title"
                  defaultValue={p.title}
                  minLength={5}
                  maxLength={160}
                  required
                />
              </div>
              <div>
                <label htmlFor="managed-body">Versión pública revisada</label>
                <textarea
                  id="managed-body"
                  name="body"
                  defaultValue={p.body}
                  minLength={20}
                  maxLength={6000}
                  rows={7}
                  required
                />
              </div>
              <PublicationFields
                disabled={locked}
                onChange={clearApproval}
                initial={p}
              />
              <div>
                <label htmlFor="correction-reason">
                  Motivo del cambio (interno)
                </label>
                <textarea
                  id="correction-reason"
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  rows={2}
                  required
                />
              </div>
              <label className="checkbox">
                <input
                  name="privacy"
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  required
                />
                <span>
                  Revisé los hechos y el riesgo de identificación de personas.
                </span>
              </label>
              <label className="checkbox">
                <input
                  name="approval"
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                  required
                />
                <span>Apruebo esta versión para su publicación.</span>
              </label>
              <div className={styles.actions}>
                <button className="button" disabled={!privacy || !approved}>
                  {busy
                    ? "Guardando…"
                    : withdrawn
                      ? "Aprobar y volver a publicar"
                      : "Aprobar corrección"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}
        {removing && (
          <form
            className="form-stack"
            aria-label="Retirar publicación"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void save("DELETE", {
                version: p.version,
                reason: String(form.get("reason")),
                confirmed: form.get("confirmed") === "on",
              });
            }}
          >
            <fieldset disabled={locked} className={styles.fields}>
              <p>
                Se retirarán el texto y la imagen del sitio. El original y el
                historial permanecerán privados.
              </p>
              <div>
                <label htmlFor="withdrawal-reason">
                  Motivo de la retirada (interno)
                </label>
                <textarea
                  id="withdrawal-reason"
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  rows={2}
                  required
                />
              </div>
              <label className="checkbox">
                <input name="confirmed" type="checkbox" required />
                <span>Confirmo la retirada de esta publicación.</span>
              </label>
              <div className={styles.actions}>
                <button className="button">
                  {busy ? "Retirando…" : "Confirmar retirada"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setRemoving(false);
                    setError("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}
        <details className={styles.history}>
          <summary>Historial de publicación</summary>
          <ol>
            {current.events.map((e) => (
              <li key={e.id}>
                <strong>{actions[e.action] ?? e.action}</strong>
                <span>
                  {e.actor_name} · {date(e.created_at)}
                </span>
                {e.reason && <p>{e.reason}</p>}
              </li>
            ))}
          </ol>
        </details>
      </section>
      {!withdrawn && (
        <PublicImagePanel
          key={`${id}-${current.image.image_version}`}
          id={id}
          context={current.image}
        />
      )}
    </div>
  );
}
