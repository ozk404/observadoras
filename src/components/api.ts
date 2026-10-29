// Bounds both the request and reading its JSON body; never retries mutations.
export async function requestJson(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000,
) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal,
    });
    let result;
    try {
      result = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw Error(
        "El servidor no devolvió una respuesta válida. Comprueba el estado antes de volver a intentar.",
      );
    }
    if (!response.ok)
      throw Object.assign(
        new Error(result?.error ?? "No se pudo completar la operación."),
        { fields: result?.fields, status: response.status },
      );
    return result;
  } catch (error) {
    if (timedOut)
      throw Error(
        "La solicitud tardó demasiado. Recarga para comprobar si se guardó antes de volver a intentar.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export async function send(
  url: string,
  body: unknown,
  method = "POST",
  timeoutMs = 30000,
) {
  return requestJson(
    url,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
}
