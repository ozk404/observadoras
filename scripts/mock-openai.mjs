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
    input.includes("@")
  ) {
    res.writeHead(400);
    res.end();
    return;
  }
  const result = {
    categories: ["desinformacion"],
    summary:
      "Se describe una situación ficticia de desinformación que podría limitar la participación de las mujeres.",
    limitations:
      "Esta simulación no verifica hechos ni reemplaza la revisión humana. Solo se considera un relato.",
  };
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
