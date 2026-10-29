import { test, expect, type Page } from "./fixtures";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
test.skip(
  process.env.TEST_AI !== "true",
  "Requires the isolated simulated provider.",
);
const endpoint = (id: string) =>
  `/api/privado/registros/${id}/generacion-alerta`;
const draftEndpoint = (id: string) =>
  `/api/privado/registros/${id}/borrador-alerta`;
const input = (
  draftVersion = 0,
  text = "Relato ficticio sobre desinformación que limita la participación política de las mujeres.",
) => ({
  text,
  privacyConfirmed: true,

  reportVersion: 2,
  draftVersion,
});
const manual = {
  title: "Alerta redactada manualmente",
  body: "Texto privado ficticio guardado manualmente antes de solicitar una propuesta.",
  reportVersion: 2,
  draftVersion: 0,
};
async function login(page: Page, role = "alert-ai-reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function create(page: Page) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Generación ficticia ${prefix}`,
      description:
        "Original ficticio privado que no debe adjuntarse automáticamente a la generación.",
      submit: true,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
async function validate(page: Page, id: string) {
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { version: 1, confirmed: true },
      })
    ).status(),
  ).toBe(200);
}
async function latest(page: Page, id: string) {
  return (await page.request.get(endpoint(id))).json();
}
async function draft(page: Page, id: string) {
  return (await (await page.request.get(draftEndpoint(id))).json()).draft;
}
async function save(page: Page, id: string, data: unknown) {
  return page.request.post(draftEndpoint(id), { headers: { origin }, data });
}
async function generate(page: Page, id: string, data: unknown) {
  return page.request.post(endpoint(id), { headers: { origin }, data });
}

test("generation is reviewed and applied explicitly, then edited and saved with provenance through later edits", async ({
  page,
}) => {
  await login(page);
  const id = await create(page);
  await validate(page, id);
  expect((await save(page, id, manual)).status()).toBe(200);
  await page.goto(`/equipo/${id}`);
  const panel = page.getByRole("region", { name: "Borrador de alerta" });
  const generator = page.getByRole("region", {
    name: "Generación de alerta con IA",
  });
  await generator.getByText("Generar con IA", { exact: true }).click();
  await generator.getByLabel("Texto para generar la alerta").fill(input().text);
  await generator.getByRole("checkbox", { name: /Revisé el texto/ }).check();
  await generator
    .getByLabel("Texto para generar la alerta")
    .fill(input().text + " Contexto ficticio adicional.");
  await expect(
    generator.getByRole("button", { name: "Solicitar propuesta" }),
  ).toBeDisabled();
  await generator.getByRole("checkbox", { name: /Revisé el texto/ }).check();
  await generator.getByRole("button", { name: "Solicitar propuesta" }).click();
  await expect(
    generator.getByRole("heading", { name: "Propuesta de IA" }),
  ).toBeVisible();
  const job = await latest(page, id);
  expect(job.status).toBe("succeeded");
  expect((await draft(page, id)).version).toBe(1);
  await expect(
    panel.getByLabel("Texto de alerta", { exact: true }),
  ).toHaveValue(manual.body);
  page.once("dialog", (dialog) => dialog.dismiss());
  await generator.getByRole("button", { name: "Usar propuesta" }).click();
  await expect(
    panel.getByLabel("Texto de alerta", { exact: true }),
  ).toHaveValue(manual.body);
  page.once("dialog", (dialog) => dialog.accept());
  await generator.getByRole("button", { name: "Usar propuesta" }).click();
  await expect(panel.getByLabel("Título de alerta")).toHaveValue(
    job.result.title,
  );
  expect((await draft(page, id)).body).toBe(manual.body);
  const edited = job.result.body + " Corrección humana antes de guardar.";
  await panel.getByLabel("Texto de alerta", { exact: true }).fill(edited);
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect.poll(async () => (await draft(page, id)).version).toBe(2);
  expect((await draft(page, id)).source).toEqual({
    kind: "generated",
    id: job.id,
  });
  await page.reload();
  await expect(
    panel.getByLabel("Texto de alerta", { exact: true }),
  ).toHaveValue(edited);
  await panel
    .getByLabel("Texto de alerta", { exact: true })
    .fill(edited + " Otra edición humana.");
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect.poll(async () => (await draft(page, id)).version).toBe(3);
  expect((await draft(page, id)).source).toEqual({
    kind: "generated",
    id: job.id,
  });
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.version).toBe(2);
  expect(record.status).toBe("validated");
  await expect(
    panel.getByRole("button", { name: "Guardar borrador" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "artifacts/alert-generation-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/alert-generation-mobile.png",
    fullPage: true,
  });
});

test("privacy and provider failures retain saved text and manual editing remains available", async ({
  page,
}) => {
  await login(page);
  const id = await create(page);
  await validate(page, id);
  expect((await save(page, id, manual)).status()).toBe(200);
  expect(
    (
      await generate(page, id, { ...input(1), privacyConfirmed: false })
    ).status(),
  ).toBe(400);
  expect(
    (
      await generate(
        page,
        id,
        input(
          1,
          "Relato ficticio con correo prueba@example.test que debe bloquearse antes de enviarse.",
        ),
      )
    ).status(),
  ).toBe(400);
  expect(await latest(page, id)).toBeNull();
  expect(
    (
      await generate(
        page,
        id,
        input(
          1,
          "Relato ficticio para simular fallo del proveedor al preparar una alerta.",
        ),
      )
    ).status(),
  ).toBe(502);
  expect((await latest(page, id)).result).toBeNull();
  expect((await draft(page, id)).body).toBe(manual.body);
  expect(
    (
      await save(page, id, {
        ...manual,
        draftVersion: 1,
        body: manual.body + " Continuación manual tras el fallo.",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await generate(
        page,
        id,
        input(
          2,
          "Relato ficticio para simular respuesta invalida de una propuesta de alerta.",
        ),
      )
    ).status(),
  ).toBe(502);
  expect(
    (
      await generate(
        page,
        id,
        input(
          2,
          "Relato ficticio para simular salida identificable y rechazar el resultado.",
        ),
      )
    ).status(),
  ).toBe(502);
  const failed = await latest(page, id);
  expect(failed.error_code).toBe("invalid_response");
  expect(failed.result).toBeNull();
  expect(
    (
      await save(page, id, {
        ...manual,
        draftVersion: 2,
        source: { kind: "generated", id: failed.id },
      })
    ).status(),
  ).toBe(409);
  await page.goto(`/equipo/${id}`);
  await expect(page.getByLabel("Título de alerta")).toBeEnabled();
  expect((await draft(page, id)).version).toBe(2);
});

test("concurrent requests are bounded and results are discarded when draft or report changes", async ({
  page,
}) => {
  await login(page);
  const id = await create(page);
  await validate(page, id);
  const pending = generate(
    page,
    id,
    input(
      0,
      "Relato ficticio para simular demora alerta y comprobar versiones del borrador.",
    ),
  );
  await expect
    .poll(async () => (await latest(page, id))?.status, {
      intervals: [50, 100],
      timeout: 5000,
    })
    .toBe("running");
  expect((await generate(page, id, input())).status()).toBe(409);
  expect((await save(page, id, manual)).status()).toBe(200);
  expect((await pending).status()).toBe(409);
  expect((await latest(page, id)).result).toBeNull();
  expect((await draft(page, id)).body).toBe(manual.body);
  const success = await generate(page, id, input(1));
  expect(success.status()).toBe(201);
  const job = await success.json();
  expect(
    (
      await save(page, id, {
        ...manual,
        draftVersion: 1,
        body: manual.body + " Edición que deja obsoleta la propuesta.",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await save(page, id, {
        ...manual,
        draftVersion: 2,
        source: { kind: "generated", id: job.id },
      })
    ).status(),
  ).toBe(409);
  const other = await create(page);
  await validate(page, other);
  const late = generate(
    page,
    other,
    input(
      0,
      "Relato ficticio para simular demora alerta mientras cambia el estado principal.",
    ),
  );
  await expect
    .poll(async () => (await latest(page, other))?.status, {
      intervals: [50, 100],
      timeout: 5000,
    })
    .toBe("running");
  expect(
    (
      await page.request.post(`/api/privado/registros/${other}/publicacion`, {
        headers: { origin },
        data: {
          version: 2,
          title: `Publicación humana independiente ${prefix}`,
          body: "Texto público ficticio aprobado mientras se prepara una propuesta privada de alerta.",
          privacyConfirmed: true,
          publicationConfirmed: true,
        },
      })
    ).status(),
  ).toBe(201);
  expect((await late).status()).toBe(409);
  expect((await latest(page, other)).result).toBeNull();
  expect(
    (await (await page.request.get(`/api/privado/registros/${other}`)).json())
      .status,
  ).toBe("published");
});

test("only reviewers can request or read proposals, with valid origin, versions and strict identity fields", async ({
  page,
  browser,
}) => {
  await login(page, "alert-participant");
  const id = await create(page);
  expect((await page.request.get(endpoint(id))).status()).toBe(403);
  expect((await generate(page, id, input())).status()).toBe(403);
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  await login(reviewer, "followup-reviewer");
  expect(
    (await generate(reviewer, id, { ...input(), reportVersion: 1 })).status(),
  ).toBe(409);
  await validate(reviewer, id);
  expect(
    (await generate(reviewer, id, { ...input(), reportVersion: 99 })).status(),
  ).toBe(409);
  expect((await generate(reviewer, id, input(9))).status()).toBe(409);
  expect(
    (
      await generate(reviewer, id, { ...input(), requested_by: "forged" })
    ).status(),
  ).toBe(400);
  expect(
    (
      await reviewer.request.post(endpoint(id), {
        headers: { origin: "https://foreign.test" },
        data: input(),
      })
    ).status(),
  ).toBe(403);
  expect(await latest(reviewer, id)).toBeNull();
  await page.goto(`/equipo/${id}`);
  await expect(
    page.getByRole("region", { name: "Generación de alerta con IA" }),
  ).toHaveCount(0);
  expect(
    JSON.stringify(
      await (await page.request.get(`/api/privado/registros/${id}`)).json(),
    ),
  ).not.toContain("alert_generations");
  const visitor = await browser.newContext();
  expect((await visitor.request.get(`${origin}${endpoint(id)}`)).status()).toBe(
    401,
  );
  expect(
    (
      await visitor.request.post(`${origin}${endpoint(id)}`, {
        headers: { origin },
        data: input(),
      })
    ).status(),
  ).toBe(401);
  await visitor.close();
  await reviewerContext.close();
});
