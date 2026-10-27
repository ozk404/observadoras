"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./api";
import { Arrow } from "./icons";
function useFormReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
export function LoginForm() {
  const ready = useFormReady();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);
  return (
    <form
      method="post"
      className="form-stack login-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || !ready) return;
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          await send("/api/auth/login", Object.fromEntries(data));
          router.push("/equipo");
          router.refresh();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && (
        <p className="error" role="alert" ref={feedback} tabIndex={-1}>
          {error}
        </p>
      )}
      <div>
        <label htmlFor="username">Nombre de usuario</label>
        <input
          disabled={!ready || busy}
          id="username"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={64}
        />
      </div>
      <div>
        <label htmlFor="password">Contraseña</label>
        <div className="password-control">
          <input
            disabled={!ready || busy}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            maxLength={128}
          />
          <button
            type="button"
            disabled={!ready || busy}
            aria-controls="password"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            onClick={() => setShowPassword((previous) => !previous)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>
      <button className="button" disabled={busy || !ready}>
        {busy ? "Ingresando…" : "Ingresar al área privada"} <Arrow />
      </button>
    </form>
  );
}
export function Logout() {
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="text-button"
        onClick={async () => {
          try {
            await send("/api/auth/logout", {});
            window.location.assign("/ingreso");
          } catch {
            setError("No se pudo cerrar sesión. Inténtalo otra vez.");
          }
        }}
      >
        Cerrar sesión
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function DraftForm({
  report,
  corrections = false,
}: {
  report?: { id: string; title: string; description: string; version: number };
  corrections?: boolean;
}) {
  const ready = useFormReady();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      method="post"
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const submit =
          (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
          "submit";
        if (
          submit &&
          !window.confirm(
            corrections
              ? "¿Reenviar las correcciones a revisión? El registro dejará de ser editable hasta que el equipo solicite otros ajustes."
              : "¿Enviar a revisión? El registro dejará de ser editable como borrador.",
          )
        )
          return;
        setBusy(true);
        setError("");
        const data = new FormData(form);
        try {
          const result = await send(
            report
              ? `/api/privado/registros/${report.id}`
              : "/api/privado/registros",
            {
              title: data.get("title"),
              description: data.get("description"),
              submit,
              ...(report ? { version: report.version } : {}),
            },
            report ? "PATCH" : "POST",
          );
          router.push(`/equipo/${report?.id ?? result.id}`);
          router.refresh();
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
        <label htmlFor="title">Título breve</label>
        <input
          disabled={!ready}
          id="title"
          name="title"
          required
          maxLength={160}
          defaultValue={report?.title}
        />
      </div>
      <div>
        <label htmlFor="description">Descripción</label>
        <p className="help" id="draft-help">
          {corrections
            ? "Al reenviar, usa al menos 5 caracteres en el título y 20 en la descripción. Puedes guardar avances incompletos. Evita datos identificables innecesarios."
            : "Evita datos identificables innecesarios. Puedes completar el relato después."}
        </p>
        <textarea
          disabled={!ready}
          id="description"
          name="description"
          rows={8}
          maxLength={6000}
          defaultValue={report?.description}
          aria-describedby="draft-help"
        />
      </div>
      <div className="form-actions">
        <button
          className="button secondary"
          value="draft"
          disabled={busy || !ready}
        >
          {corrections ? "Guardar correcciones" : "Guardar borrador"}
        </button>
        <button className="button" value="submit" disabled={busy || !ready}>
          {corrections ? "Reenviar a revisión" : "Enviar a revisión"} <Arrow />
        </button>
      </div>
    </form>
  );
}
export function PublicationForm({
  id,
  version,
  initialBody = "",
  bodyRevision = 0,
}: {
  id: string;
  version: number;
  initialBody?: string;
  bodyRevision?: number;
}) {
  const ready = useFormReady();
  const [body, setBody] = useState(initialBody);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [publicationConfirmed, setPublicationConfirmed] = useState(false);
  useEffect(() => {
    setBody(initialBody);
    setPrivacyConfirmed(false);
    setPublicationConfirmed(false);
  }, [initialBody, bodyRevision]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      method="post"
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          !window.confirm(
            "¿Publicar esta versión revisada? Su título y texto serán visibles para cualquier persona.",
          )
        )
          return;
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          await send(`/api/privado/registros/${id}/publicacion`, {
            title: data.get("publicTitle"),
            body: data.get("publicBody"),
            privacyConfirmed: data.get("privacy") === "on",
            publicationConfirmed: data.get("publish") === "on",
            version,
          });
          router.refresh();
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
        <label htmlFor="publicTitle">Título público</label>
        <input
          disabled={!ready}
          id="publicTitle"
          name="publicTitle"
          onChange={() => {
            setPrivacyConfirmed(false);
            setPublicationConfirmed(false);
          }}
          minLength={5}
          maxLength={160}
          required
        />
      </div>
      <div>
        <label htmlFor="publicBody">Versión pública revisada</label>
        <p className="help" id="public-help">
          Redacta una síntesis sin nombres, contactos, usuarios, enlaces
          identificables ni combinaciones que permitan reconocer a alguien. No
          copies el relato original sin revisarlo.
        </p>
        <textarea
          disabled={!ready}
          id="publicBody"
          name="publicBody"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setPrivacyConfirmed(false);
            setPublicationConfirmed(false);
          }}
          rows={8}
          minLength={20}
          maxLength={6000}
          required
          aria-describedby="public-help"
        />
      </div>
      <label className="checkbox">
        <input
          disabled={!ready}
          name="privacy"
          type="checkbox"
          required
          checked={privacyConfirmed}
          onChange={(e) => setPrivacyConfirmed(e.target.checked)}
        />
        <span>
          Revisé los hechos y el riesgo de identificación de personas en este
          título y texto.
        </span>
      </label>
      <label className="checkbox">
        <input
          disabled={!ready}
          name="publish"
          type="checkbox"
          required
          checked={publicationConfirmed}
          onChange={(e) => setPublicationConfirmed(e.target.checked)}
        />
        <span>
          Apruebo explícitamente que esta versión sea pública. Esta aprobación
          no constituye una determinación judicial.
        </span>
      </label>
      <button className="button" disabled={busy || !ready}>
        {busy ? "Publicando…" : "Aprobar y publicar esta versión"} <Arrow />
      </button>
    </form>
  );
}
