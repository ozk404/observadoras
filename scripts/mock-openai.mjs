// Dedicated, labelled integration fixture. Never calls an external provider.
import { createServer } from "node:http";
createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/v1/responses") {
    res.writeHead(404);
    res.end();
    return;
  }
  let body = "";
  for await (const part of req) {
    body += part;
    if (body.length > 30000) {
      res.writeHead(413);
      res.end();
      return;
    }
  }
  const payload = JSON.parse(body);
  const input = payload.input?.[0]?.content?.[0]?.text ?? "";
  if (input.includes("simular demora alerta"))
    await new Promise((resolve) => setTimeout(resolve, 3000));
  if (input.includes("simular rechazo alerta")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "refusal", refusal: "fixture refusal" }],
          },
        ],
      }),
    );
    return;
  }
  if (input.includes("simular demora inicial"))
    await new Promise((resolve) => setTimeout(resolve, 4000));
  if (input.includes("simular espera"))
    await new Promise((resolve) => setTimeout(resolve, 1000));
  if (input.includes("simular fallo")) {
    res.writeHead(503);
    res.end("simulated failure");
    return;
  }
  if (input.includes("simular respuesta invalida")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "completed", output: [] }));
    return;
  }
  if (
    payload.store !== false ||
    payload.text?.format?.type !== "json_schema" ||
    (input.includes("@") &&
      payload.text?.format?.name !== "observadoras_intake")
  ) {
    res.writeHead(400);
    res.end();
    return;
  }
  let result = {
    categories: ["desinformacion"],
    summary:
      "Se describe una situación ficticia de desinformación que podría limitar la participación de las mujeres.",
    limitations:
      "Esta simulación no verifica hechos ni reemplaza la revisión humana. Solo se considera un relato.",
  };
  if (payload.text.format.name === "observadoras_alert_draft") {
    result = {
      title: "Alerta sobre un relato ficticio",
      body: input.includes("simular salida identificable")
        ? "Una referencia ficticia con correo prueba@example.test que debe bloquearse."
        : "Se recibió un relato ficticio sobre desinformación y participación política de las mujeres. El equipo debe revisar el contexto antes de decidir cualquier acción.",
      limitations:
        "El relato no está verificado. Se requiere revisión humana y contexto adicional.",
    };
  }
  if (payload.text.format.name === "observadoras_intake") {
    if (
      !payload.input[0].content.some(
        (part) =>
          part.type === "input_image" &&
          part.image_url.startsWith("data:image/webp;base64,"),
      )
    ) {
      res.writeHead(400);
      res.end();
      return;
    }
    Object.assign(result, {
      assessment: input.includes("sin relación")
        ? "out_of_scope"
        : "needs_context",
      assessmentReason:
        "La descripción requiere comprobar contexto antes de determinar su pertinencia.",
      evidenceNotes:
        "La captura es sintética y no permite certificar autenticidad de hechos.",
      observations: [
        "Revisar la relación entre el relato y la captura antes de validar.",
      ],
      missingInformation: [
        "Falta contexto sobre la relación con la participación política.",
      ],
    });
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "completed",
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: JSON.stringify(result) }],
        },
      ],
    }),
  );
}).listen(4000, "0.0.0.0", () =>
  console.log("Fictional OpenAI fixture listening. No external calls."),
);
