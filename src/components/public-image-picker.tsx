"use client";
import { useEffect, useRef, useState } from "react";
import { EVIDENCE_TYPES, MAX_EVIDENCE_BYTES } from "@/lib/evidence";
import styles from "./public-image.module.css";
export function PublicImagePicker({
  originalUrl,
  useOriginal,
  onOriginal,
  file,
  onFile,
  description,
  onDescription,
  confirmed,
  onConfirmed,
  disabled = false,
}: {
  originalUrl: string;
  useOriginal: boolean;
  onOriginal: (value: boolean) => void;
  file: File | null;
  onFile: (file: File | null) => void;
  description: string;
  onDescription: (value: string) => void;
  confirmed: boolean;
  onConfirmed: (value: boolean) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      if (input.current) input.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <fieldset className={styles.picker} disabled={disabled}>
      <legend>Imagen pública (opcional)</legend>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={useOriginal}
          onChange={(event) => {
            onOriginal(event.target.checked);
            onFile(null);
            onDescription("");
            onConfirmed(false);
          }}
        />
        <span>Incluir captura original</span>
      </label>
      <label htmlFor="public-image-file">Subir otra imagen</label>
      <input
        ref={input}
        id="public-image-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (!chosen) return;
          onOriginal(false);
          setError("");
          onConfirmed(false);
          onDescription("");
          if (
            !EVIDENCE_TYPES.includes(chosen.type) ||
            !chosen.size ||
            chosen.size > MAX_EVIDENCE_BYTES
          ) {
            event.target.value = "";
            onFile(null);
            setError("Usa una imagen PNG, JPG o WebP de hasta 5 MB.");
            return;
          }
          onFile(chosen);
        }}
      />
      <span className={styles.help}>PNG, JPG o WebP · hasta 5 MB</span>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {(file || useOriginal) && (
        <>
          {(preview || useOriginal) && (
            <img
              className={styles.preview}
              src={useOriginal ? originalUrl : preview}
              alt="Vista previa de la imagen pública"
            />
          )}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              onOriginal(false);
              onFile(null);
              onDescription("");
              onConfirmed(false);
            }}
          >
            Quitar imagen seleccionada
          </button>
          <label htmlFor="public-image-description">
            Descripción de la imagen pública
          </label>
          <input
            id="public-image-description"
            value={description}
            onChange={(event) => {
              onDescription(event.target.value);
              onConfirmed(false);
            }}
            required
            minLength={5}
            maxLength={240}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onConfirmed(event.target.checked)}
              required
            />
            <span>
              Revisé los datos visibles y la descripción; tengo autorización
              para publicar esta copia. Podrá ser vista y guardada por otras
              personas.
            </span>
          </label>
        </>
      )}
    </fieldset>
  );
}
