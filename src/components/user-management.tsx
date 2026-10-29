"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedUser } from "@/server/users";
import { TeamNavigation } from "./team-navigation";
import { send, requestJson } from "./api";
import styles from "@/app/equipo/usuarios/users.module.css";
type History = {
  id: string;
  action: string;
  origin: string;
  changed_fields: string[];
  created_at: string;
  actor_name: string | null;
};
const actionLabels: Record<string, string> = {
  created: "Cuenta creada",
  updated: "Cuenta actualizada",
  password_reset: "Contraseña restablecida",
  disabled: "Cuenta desactivada",
  admin_granted: "Administración habilitada",
  name_updated: "Nombre actualizado",
};
const fieldLabels: Record<string, string> = {
  username: "usuario",
  full_name: "nombre",
  role: "revisión",
  can_manage_users: "administración",
  enabled: "acceso",
  password: "contraseña",
};
export function UserManagement({
  users,
  actorId,
  reviewer,
  search,
}: {
  users: ManagedUser[];
  actorId: string;
  reviewer: boolean;
  search: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [mode, setMode] = useState<"create" | "edit" | "password" | null>(null);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const isOpen = mode !== null;
  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const node = dialog.current;
    node.showModal();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    node.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
    return () => {
      node.close();
      document.documentElement.style.overflow = previous;
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);
  useEffect(() => {
    if (mode !== "edit" || !selected) return;
    let cancelled = false;
    setHistory([]);
    setHistoryError(false);
    requestJson(`/api/privado/usuarios/${selected.id}/historial`, {
      cache: "no-store",
    })
      .then((value) => {
        if (!cancelled) setHistory(value);
      })
      .catch(() => {
        if (!cancelled) setHistoryError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selected]);
  function close() {
    if (busy) return;
    setMode(null);
    setPassword("");
    setError("");
    setShow(false);
  }
  function open(user: ManagedUser | null, button: HTMLElement) {
    returnTo.current = button;
    setSelected(user);
    setName(user?.full_name ?? "");
    setUsername(user?.username ?? "");
    setEnabled(user?.enabled ?? true);
    setAdmin(user?.can_manage_users ?? false);
    setPassword("");
    setShow(false);
    setError("");
    setNotice("");
    setMode(user ? "edit" : "create");
  }
  return (
    <>
      <header className={styles.heading}>
        <h1>Usuarios</h1>
        <div className={styles.headerActions}>
          <TeamNavigation inHeader reviewer={reviewer} canManageUsers />
          <button
            className={styles.primary}
            disabled={!ready}
            onClick={(event) => open(null, event.currentTarget)}
          >
            Crear cuenta <span aria-hidden="true">＋</span>
          </button>
        </div>
      </header>
      <form className={styles.search} action="/equipo/usuarios" method="get">
        <label htmlFor="user-search">Buscar por nombre o usuario</label>
        <div>
          <input
            id="user-search"
            name="buscar"
            defaultValue={search}
            maxLength={100}
          />
          <button type="submit" className={styles.secondary}>
            Buscar
          </button>
        </div>
      </form>
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      <section aria-label="Listado de usuarios" className={styles.list}>
        {users.length ? (
          users.map((user) => (
            <article key={user.id} className={styles.row}>
              <div className={styles.identity}>
                <strong>{user.full_name || "Nombre pendiente"}</strong>
                <span>
                  @{user.username}
                  {user.id === actorId ? " · Tu cuenta" : ""}
                </span>
              </div>
              <div className={styles.permissions}>
                <span>
                  {user.role === "reviewer"
                    ? "Revisión de reportes"
                    : "Participante"}
                </span>
                {user.can_manage_users && (
                  <span className={styles.admin}>Administración</span>
                )}
              </div>
              <span className={user.enabled ? styles.active : styles.inactive}>
                {user.enabled ? "Activa" : "Desactivada"}
              </span>
              <button
                className={styles.secondary}
                disabled={!ready}
                aria-label={`Editar cuenta de ${user.full_name || user.username}`}
                onClick={(event) => open(user, event.currentTarget)}
              >
                Editar
              </button>
            </article>
          ))
        ) : (
          <p className={styles.empty}>
            No hay cuentas que coincidan con la búsqueda.
          </p>
        )}
      </section>
      {mode && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="user-dialog-title"
          onCancel={(event) => {
            if (busy) event.preventDefault();
            else close();
          }}
          onClose={close}
        >
          <div className={styles.dialogHeader}>
            <h2 id="user-dialog-title">
              {mode === "create"
                ? "Crear cuenta"
                : mode === "edit"
                  ? "Editar cuenta"
                  : "Restablecer contraseña"}
            </h2>
            <button
              className={styles.icon}
              type="button"
              aria-label="Cerrar"
              disabled={busy}
              onClick={close}
            >
              ×
            </button>
          </div>
          <form
            className={styles.form}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              if (
                mode === "edit" &&
                selected?.enabled &&
                !enabled &&
                !window.confirm(
                  "¿Desactivar esta cuenta? Se cerrarán sus sesiones.",
                )
              )
                return;
              if (
                mode === "password" &&
                !window.confirm(
                  "¿Restablecer la contraseña? Se cerrarán todas las sesiones de esta cuenta.",
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                if (mode === "create")
                  await send("/api/privado/usuarios", {
                    fullName: name,
                    username,
                    password,
                    canManageUsers: admin,
                  });
                else
                  await send(
                    `/api/privado/usuarios/${selected!.id}`,
                    mode === "password"
                      ? {
                          action: "reset_password",
                          password,
                          version: selected!.version,
                        }
                      : {
                          action: "update",
                          fullName: name.trim() || null,
                          enabled,
                          canManageUsers: admin,
                          version: selected!.version,
                        },
                    "PATCH",
                  );
                setNotice(
                  mode === "create"
                    ? "Cuenta creada."
                    : mode === "password"
                      ? "Contraseña restablecida. Sesiones cerradas."
                      : "Cambios guardados.",
                );
                setMode(null);
                setPassword("");
                setShow(false);
                router.refresh();
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {mode !== "password" ? (
              <>
                <div>
                  <label htmlFor="account-name">Nombre completo</label>
                  <input
                    id="account-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required={mode === "create" || !!selected?.full_name}
                    minLength={2}
                    maxLength={120}
                    autoComplete="off"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label htmlFor="account-username">Nombre de usuario</label>
                  <input
                    id="account-username"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value.toLowerCase())
                    }
                    required
                    pattern="[a-z0-9._\-]{3,64}"
                    maxLength={64}
                    autoCapitalize="none"
                    spellCheck={false}
                    autoComplete="off"
                    disabled={busy || mode === "edit"}
                  />
                </div>
              </>
            ) : (
              <p className={styles.context}>
                {selected?.full_name || selected?.username} · @
                {selected?.username}
              </p>
            )}
            {mode !== "edit" && (
              <div>
                <label htmlFor="account-password">
                  {mode === "create" ? "Contraseña" : "Nueva contraseña"}
                </label>
                <div className={styles.password}>
                  <input
                    id="account-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={14}
                    maxLength={128}
                    autoComplete="new-password"
                    disabled={busy}
                    aria-describedby="password-rule"
                  />
                  <button
                    type="button"
                    className={styles.secondary}
                    aria-label={
                      show ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    onClick={() => setShow((value) => !value)}
                  >
                    {show ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p id="password-rule" className={styles.help}>
                  14 caracteres como mínimo. Comparte la clave por un canal
                  privado.
                </p>
              </div>
            )}
            {mode !== "password" && (
              <fieldset disabled={busy}>
                <legend>Acceso</legend>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={admin}
                    onChange={(event) => setAdmin(event.target.checked)}
                    disabled={selected?.id === actorId}
                  />
                  <span>Administrar usuarios</span>
                </label>
                {mode === "create" && (
                  <p className={styles.help}>
                    Esta cuenta podrá revisar reportes.
                  </p>
                )}
                {mode === "edit" && (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => setEnabled(event.target.checked)}
                      disabled={selected?.id === actorId}
                    />
                    <span>Cuenta activa</span>
                  </label>
                )}
              </fieldset>
            )}
            <div className={styles.actions}>
              <button
                className={styles.secondary}
                type="button"
                disabled={busy}
                onClick={close}
              >
                Cancelar
              </button>
              <button className={styles.primary} disabled={busy}>
                {busy
                  ? "Guardando…"
                  : mode === "create"
                    ? "Crear cuenta"
                    : mode === "password"
                      ? "Restablecer contraseña"
                      : "Guardar cambios"}
              </button>
            </div>
          </form>
          {mode === "edit" && (
            <div className={styles.extra}>
              {selected?.id !== actorId && (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setError("");
                    setPassword("");
                    setMode("password");
                  }}
                >
                  Restablecer contraseña
                </button>
              )}
              <details>
                <summary>Historial de la cuenta</summary>
                {historyError ? (
                  <p role="alert">No se pudo cargar el historial.</p>
                ) : history.length ? (
                  <ol>
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <strong>
                          {actionLabels[entry.action] ?? entry.action}
                        </strong>
                        <span>
                          {entry.actor_name || "Operación técnica"} ·{" "}
                          {new Date(entry.created_at).toLocaleString("es-GT", {
                            timeZone: "America/Guatemala",
                          })}
                        </span>
                        <span>
                          {entry.changed_fields
                            .map((field) => fieldLabels[field] ?? field)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Sin cambios registrados.</p>
                )}
              </details>
            </div>
          )}
        </dialog>
      )}
    </>
  );
}
