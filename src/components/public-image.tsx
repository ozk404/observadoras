"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./public-image.module.css";
export function PublicImage({
  assetId,
  description,
}: {
  assetId: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const image = useRef<HTMLImageElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const source = `/api/imagenes-publicas/${assetId}`;
  useEffect(() => {
    setFailed(!!image.current?.complete && image.current.naturalWidth === 0);
    setOpen(false);
  }, [assetId]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    node.showModal();
    node
      .querySelector<HTMLButtonElement>('[aria-label="Cerrar imagen"]')
      ?.focus();
    return () => {
      node.close();
      document.documentElement.style.overflow = overflow;
      button.current?.focus({ preventScroll: true });
    };
  }, [open]);
  if (failed) return <p>La imagen pública no está disponible.</p>;
  return (
    <figure className={styles.figure}>
      <button
        ref={button}
        className={styles.open}
        type="button"
        disabled={!ready}
        aria-label="Ampliar imagen pública"
        onClick={() => {
          setZoom(false);
          setOpen(true);
        }}
      >
        <img
          ref={image}
          src={source}
          alt={description}
          onError={() => {
            setOpen(false);
            setFailed(true);
          }}
        />
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-label="Imagen pública"
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <header className={styles.toolbar}>
            <button
              type="button"
              aria-pressed={zoom}
              onClick={() => setZoom((value) => !value)}
            >
              {zoom ? "Ajustar a pantalla" : "Tamaño real"}
            </button>
            <button
              type="button"
              aria-label="Cerrar imagen"
              onClick={() => setOpen(false)}
            >
              Cerrar ×
            </button>
          </header>
          <div className={`${styles.canvas}${zoom ? ` ${styles.zoom}` : ""}`}>
            <img
              src={source}
              alt={description}
              onError={() => {
                setOpen(false);
                setFailed(true);
              }}
            />
          </div>
        </dialog>
      )}
    </figure>
  );
}
