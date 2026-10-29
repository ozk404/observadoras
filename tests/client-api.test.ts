import { test } from "node:test";
import assert from "node:assert/strict";
import { requestJson, send } from "../src/components/api";
test("client requests stop on timeout without retrying writes and retain validation errors", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      calls++;
      return await new Promise<Response>((_resolve, reject) =>
        options!.signal!.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        ),
      );
    };
    await assert.rejects(
      send("/fixture", { note: "Contenido ficticio" }, "POST", 10),
      /comprueba|comprobar/,
    );
    assert.equal(calls, 1);
    globalThis.fetch = async () =>
      Response.json(
        {
          error: "Error de validación ficticio",
          fields: { note: ["Revisa la nota"] },
        },
        { status: 400 },
      );
    await assert.rejects(send("/fixture", {}), (error) => {
      assert.equal((error as any).fields.note[0], "Revisa la nota");
      assert.equal((error as any).status, 400);
      return true;
    });
    globalThis.fetch = async () =>
      new Response("<html>Fallo ficticio</html>", { status: 502 });
    await assert.rejects(requestJson("/fixture"), /respuesta válida/);
    globalThis.fetch = async () => Response.json({ version: 2 });
    assert.deepEqual(await send("/fixture", {}), { version: 2 });
  } finally {
    globalThis.fetch = original;
  }
});
