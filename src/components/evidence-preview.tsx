"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./evidence-preview.module.css";

function EmptyCapture({
  failed = false,
  large = false,
}: {
  failed?: boolean;
  large?: boolean;
}) {
  return (
    <span
      className={`${styles.placeholder}${large ? ` ${styles.large}` : ""}`}
      role={failed ? "img" : undefined}
      aria-label={failed ? "Captura no disponible" : undefined}
      aria-hidden={!failed ? true : undefined}
    >
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect
          x="6"
          y="4"
          width="20"
          height="24"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M11 12h10M11 17h10M11 22h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function EvidencePreview({
  id,
  title,
  available,
  large = false,
}: {
  id: string;
  title: string;
  available: boolean;
  large?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const thumbnailImage = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setReady(true);
    const image = thumbnailImage.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const source = `/api/privado/registros/${id}/evidencia`;
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    node.showModal();
    node
      .querySelector<HTMLButtonElement>("[aria-label='Cerrar captura']")
      ?.focus();
    return () => {
      node.close();
      document.documentElement.style.overflow = overflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!available || failed)
    return <EmptyCapture failed={failed} large={large} />;
  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={!ready}
        className={`${styles.thumbnail}${large ? ` ${styles.large}` : ""}`}
        aria-label={`Ampliar captura de ${title}`}
        onClick={() => {
          setFullFailed(false);
          setZoomed(false);
          setOpen(true);
        }}
      >
        <img
          ref={thumbnailImage}
          src={large ? source : `${source}?vista=miniatura`}
          alt={large ? "Imagen adjunta al reporte" : ""}
          width={256}
          height={192}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-label="Captura adjunta"
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className={styles.panel}>
            <header>
              <h2>Captura adjunta</h2>
              <div>
                {!fullFailed && (
                  <button
                    type="button"
                    aria-pressed={zoomed}
                    onClick={() => setZoomed((value) => !value)}
                  >
                    {zoomed ? "Ajustar a pantalla" : "Tamaño real"}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.close}
                  aria-label="Cerrar captura"
                  onClick={() => setOpen(false)}
                  autoFocus
                >
                  Cerrar <span aria-hidden="true">×</span>
                </button>
              </div>
            </header>
            <div
              className={`${styles.canvas}${zoomed ? ` ${styles.zoomed}` : ""}`}
            >
              {fullFailed ? (
                <p role="alert">Captura no disponible.</p>
              ) : (
                <img
                  src={source}
                  alt="Captura completa del reporte"
                  onError={() => setFullFailed(true)}
                />
              )}
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
