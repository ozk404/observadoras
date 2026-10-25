import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { db } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function secret() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
    throw new Error("AUTH_SECRET must have at least 32 characters");
  return process.env.AUTH_SECRET;
}
export function networkKey(request: Request) {
  const address =
    process.env.TRUST_PROXY === "true"
      ? (request.headers.get("x-real-ip") ?? "unknown")
      : "shared";
  return createHmac("sha256", secret())
    .update(`${new Date().toISOString().slice(0, 10)}:${address}`)
    .digest("hex");
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== process.env.APP_ORIGIN)
    throw new HttpError(
      403,
      "Solicitud no permitida. Recarga la página e inténtalo de nuevo.",
    );
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Formato no permitido.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Completa el formulario.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 26000) {
      await reader.cancel();
      throw new HttpError(413, "El contenido supera el tamaño permitido.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "No se pudo leer el formulario.");
  }
}
export async function limit(key: string, maximum: number, seconds: number) {
  const result = await db.query(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,
    expires_at=CASE WHEN rate_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING count`,
    [key, seconds],
  );
  if (result.rows[0].count > maximum)
    throw new HttpError(
      429,
      "Se alcanzó el límite de intentos. Espera unos minutos antes de volver a intentar.",
    );
}
export function formToken() {
  const payload = `${randomBytes(16).toString("hex")}.${Date.now()}`;
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export function verifyFormToken(token: string) {
  const [nonce, time, signature] = token.split(".");
  if (
    !/^[a-f0-9]{32}$/.test(nonce ?? "") ||
    !/^\d{13}$/.test(time ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    throw new HttpError(400, "Recarga el formulario antes de enviar.");
  const expected = createHmac("sha256", secret())
    .update(`${nonce}.${time}`)
    .digest();
  const age = Date.now() - Number(time);
  if (
    !timingSafeEqual(expected, Buffer.from(signature, "hex")) ||
    age < 1500 ||
    age > 3600000
  )
    throw new HttpError(
      400,
      "El formulario expiró o se envió demasiado rápido. Recárgalo e inténtalo de nuevo.",
    );
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.status === 429 ? { "Retry-After": "600" } : {},
      },
    );
  if (error instanceof z.ZodError)
    return Response.json(
      {
        error: "Revisa los campos indicados.",
        fields: z.flattenError(error).fieldErrors,
      },
      { status: 400 },
    );
  // Do not log report bodies, database error details or credentials.
  console.error("Operation failed; private details omitted.");
  return Response.json(
    {
      error:
        "No pudimos completar la operación. Tu información no se ha enviado de nuevo. Inténtalo más tarde.",
    },
    { status: 503 },
  );
}
