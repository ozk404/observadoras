import sharp from "sharp";
import { HttpError } from "./security";
import { createHash } from "node:crypto";
import { MAX_EVIDENCE_BYTES, EVIDENCE_TYPES } from "../lib/evidence";
export type Evidence = {
  content: Buffer;
  width: number;
  height: number;
  sha256: string;
};
let processing = 0;
export async function normalizeEvidence(file: File): Promise<Evidence> {
  if (!file.size) throw new HttpError(400, "Adjunta una captura o imagen.");
  if (file.size > MAX_EVIDENCE_BYTES)
    throw new HttpError(413, "La imagen debe pesar como máximo 5 MB.");
  if (!EVIDENCE_TYPES.includes(file.type))
    throw new HttpError(400, "Solo se admiten imágenes PNG, JPG o WebP.");
  if (processing >= 2)
    throw new HttpError(
      429,
      "Se están procesando otras imágenes. Espera unos momentos e inténtalo de nuevo.",
    );
  processing++;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const format = buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
        ? "image/jpeg"
        : buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
          ? "image/webp"
          : null;
    if (format !== file.type)
      throw new HttpError(
        400,
        "El contenido de la imagen no coincide con su formato.",
      );
    const image = sharp(buffer, {
      limitInputPixels: 20000000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1)
      throw new HttpError(400, "Usa una imagen estática válida.");
    // Re-encoding omits EXIF, location, original filename and embedded metadata.
    const result = await image
      .rotate()
      .webp({ lossless: true, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    if (result.data.length > MAX_EVIDENCE_BYTES)
      throw new HttpError(
        413,
        "La imagen procesada supera 5 MB. Reduce su resolución y vuelve a intentar.",
      );
    return {
      content: result.data,
      width: result.info.width,
      height: result.info.height,
      sha256: createHash("sha256").update(result.data).digest("hex"),
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      400,
      "No se pudo leer la imagen. Usa un PNG, JPG o WebP válido de hasta 20 megapíxeles.",
    );
  } finally {
    processing--;
  }
}
export async function readEvidenceForm(
  request: Request,
  allowedFields?: readonly string[],
) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data;"))
    throw new HttpError(415, "Envía el formulario con la imagen.");
  const maximum = 6 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maximum)
    throw new HttpError(
      413,
      "El envío supera el tamaño permitido. Usa una imagen de hasta 5 MB.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Completa el formulario.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) {
      await reader.cancel();
      throw new HttpError(413, "El envío supera el tamaño permitido.");
    }
    chunks.push(value);
  }
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(Buffer.concat(chunks)), {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new HttpError(
      400,
      "No pudimos leer el formulario. Inténtalo de nuevo.",
    );
  }
  const allowed = allowedFields ?? [
    "description",
    "sourceUrl",
    "consent",
    "consentVersion",
    "website",
    "token",
    "submissionKey",
    "evidence",
  ];
  for (const key of form.keys())
    if (!allowed.includes(key) || form.getAll(key).length !== 1)
      throw new HttpError(
        400,
        "El formulario contiene campos no permitidos o duplicados.",
      );
  return form;
}
