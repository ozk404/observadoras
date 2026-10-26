import { test, expect, type Page } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(page: Page, role = "reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page.getByLabel("Contraseña").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function create(page: Page, suffix: string, submit = true) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Validación ficticia ${prefix} ${suffix}`,
      description:
        "Contenido privado ficticio para comprobar la validación interna independiente.",
      submit,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
test("internal human validation persists while the original stays private; publication is a separate action", async ({
  page,
  browser,
}) => {
  await login(page);
  const id = await create(page, "privada");
  await page.goto(`/equipo/${id}`);
  await expect(page.getByLabel("Título público")).toHaveCount(0);
  const publicData = {
    title: `Versión pública posterior ${prefix}`,
    body: "Texto público ficticio preparado después de una validación interna independiente.",
    privacyConfirmed: true,
    publicationConfirmed: true,
    version: 1,
  };
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: publicData,
      })
    ).status(),
  ).toBe(409);
  await page
    .getByRole("checkbox", { name: /Revisé la información y confirmo/ })
    .check();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Validar sin publicar" }).click();
  await expect(
    page.getByText("Validado internamente", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(`Por ${prefix}-reviewer`, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Validar sin publicar" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Título público")).toBeVisible();
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.status).toBe("validated");
  expect(record.version).toBe(2);
  expect(record.validated_by).toBeTruthy();
  expect(record.validated_at).toBeTruthy();
  expect(record.validation_source).toBe("explicit");
  const publicContext = await browser.newContext();
  const visitor = await publicContext.newPage();
  await visitor.goto(`${origin}/reportes`);
  await expect(
    visitor.getByText(`Validación ficticia ${prefix} privada`),
  ).toHaveCount(0);
  expect((await visitor.request.get(`/reportes/${id}`)).status()).toBe(404);
  expect(
    (
      await visitor.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 2 },
      })
    ).status(),
  ).toBe(401);
  await publicContext.close();
  await page.screenshot({
    path: "artifacts/validacion-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/validacion-mobile.png",
    fullPage: true,
  });
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 2 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: { ...publicData, version: 2, publicationConfirmed: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: publicData,
      })
    ).status(),
  ).toBe(409);
  const published = await page.request.post(
    `/api/privado/registros/${id}/publicacion`,
    { headers: { origin }, data: { ...publicData, version: 2 } },
  );
  expect(published.status()).toBe(201);
  const publicId = (await published.json()).id;
  const after = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(after.validated_by).toBe(record.validated_by);
  expect(after.validated_at).toBe(record.validated_at);
  await page.goto(`/reportes/${publicId}`);
  await expect(
    page.getByRole("heading", { name: publicData.title }),
  ).toBeVisible();
  await expect(page.getByText(record.description, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(record.validator_username, { exact: false }),
  ).toHaveCount(0);
});
test("validation enforces role, consent, origin, state and version; concurrency permits one transition", async ({
  page,
  browser,
}) => {
  await login(page);
  const id = await create(page, "restricciones");
  const endpoint = `/api/privado/registros/${id}/validacion`;
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin },
        data: { confirmed: false, version: 1 },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin },
        data: { confirmed: true, version: 99 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin: "https://foreign.test" },
        data: { confirmed: true, version: 1 },
      })
    ).status(),
  ).toBe(403);
  const draftId = await create(page, "borrador", false);
  expect(
    (
      await page.request.post(`/api/privado/registros/${draftId}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 1 },
      })
    ).status(),
  ).toBe(409);
  const context = await browser.newContext();
  const participant = await context.newPage();
  await login(participant, "participant");
  const own = await create(participant, "participante");
  expect(
    (
      await participant.request.post(
        `/api/privado/registros/${own}/validacion`,
        { headers: { origin }, data: { confirmed: true, version: 1 } },
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await participant.request.post(endpoint, {
        headers: { origin },
        data: { confirmed: true, version: 1 },
      })
    ).status(),
  ).toBe(403);
  await context.close();
  const results = await Promise.all([
    page.request.post(endpoint, {
      headers: { origin },
      data: { confirmed: true, version: 1 },
    }),
    page.request.post(endpoint, {
      headers: { origin },
      data: { confirmed: true, version: 1 },
    }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.version).toBe(2);
  expect(record.status).toBe("validated");
});
