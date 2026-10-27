"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PublicImagePicker } from "./public-image-picker";
import { send } from "./api";
export function PublicImagePanel({
  id,
  context,
}: {
  id: string;
  context: {
    image_version: number;
    asset_id: string | null;
    description: string | null;
  };
}) {
  const router = useRouter();
  const [useOriginal, setUseOriginal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [writing, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [refreshing, startTransition] = useTransition();
  const busy = writing || refreshing || !ready;
  const [error, setError] = useState("");
  return (
    <section className="form-panel" aria-labelledby="public-image-title">
      <h2 id="public-image-title">Imagen pública</h2>
      {context.asset_id ? (
        <>
          <img
            src={`/api/imagenes-publicas/${context.asset_id}`}
            alt={context.description || "Imagen pública aprobada"}
            style={{
              width: "100%",
              height: 280,
              objectFit: "contain",
              background: "#faf7fc",
            }}
          />
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              if (
                !window.confirm(
                  "¿Retirar la imagen pública? El original privado se conserva. Las copias guardadas fuera del sitio no pueden retirarse desde aquí.",
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                await send(
                  `/api/privado/registros/${id}/imagen-publica`,
                  { version: context.image_version, confirmed: true },
                  "DELETE",
                );
                startTransition(() => router.refresh());
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Retirar imagen pública
          </button>
        </>
      ) : (
        <p>Esta publicación todavía no tiene una imagen pública.</p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if ((!file && !useOriginal) || !confirmed || busy) return;
          if (
            !window.confirm(
              "¿Publicar esta copia revisada? La imagen y su descripción serán públicas.",
            )
          )
            return;
          setBusy(true);
          setError("");
          try {
            const form = new FormData();
            form.set("version", String(context.image_version));
            if (useOriginal) form.set("imageSource", "original");
            else if (file) form.set("image", file);
            form.set("description", description);
            form.set("confirmed", String(confirmed));
            const response = await fetch(
              `/api/privado/registros/${id}/imagen-publica`,
              { method: "PUT", body: form },
            );
            const result = await response.json();
            if (!response.ok)
              throw Error(result.error || "No se pudo publicar la imagen.");
            setUseOriginal(false);
            setFile(null);
            setDescription("");
            setConfirmed(false);
            startTransition(() => router.refresh());
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <PublicImagePicker
          originalUrl={`/api/privado/registros/${id}/evidencia`}
          useOriginal={useOriginal}
          onOriginal={setUseOriginal}
          file={file}
          onFile={setFile}
          description={description}
          onDescription={setDescription}
          confirmed={confirmed}
          onConfirmed={setConfirmed}
          disabled={busy}
        />
        <button
          className="button"
          disabled={busy || (!file && !useOriginal) || !confirmed}
        >
          {busy
            ? "Guardando…"
            : context.asset_id
              ? "Reemplazar imagen pública"
              : "Aprobar imagen pública"}
        </button>
      </form>
    </section>
  );
}
