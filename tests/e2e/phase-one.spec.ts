import { test, expect } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const password = process.env.TEST_PASSWORD;
const prefix = process.env.TEST_PREFIX ?? "test";
test.beforeAll(() => {
  if (!password)
    throw new Error(
      "Set TEST_PASSWORD for explicitly provisioned fictional test accounts.",
    );
});
async function login(page: import("@playwright/test").Page, username: string) {
  username = username.replace(/^test/, prefix);
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
test("public intake → private human review → separately approved public version", async ({
  page,
  browser,
}) => {
  let submitted: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/denuncias") && request.method() === "POST")
      submitted = request.postDataJSON();
  });
  const unique = prefix;
  const privateTitle = `Relato privado ficticio ${unique}`;
  const privateText = `Texto privado de prueba ${unique}, que no debe aparecer en el catálogo público.`;
  const publicTitle = `Versión revisada ficticia ${unique}`;
  await page.goto("/denuncia");
  await page.getByLabel("Título breve").fill(privateTitle);
  await page.getByLabel("¿Qué ocurrió?").fill(privateText);
  await page.getByRole("checkbox").check();
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu denuncia fue recibida." }),
  ).toBeVisible();
  expect(submitted).toBeDefined();
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        data: submitted,
      })
    ).status(),
  ).toBe(201);
  await page.goto("/denuncias");
  await expect(page.getByText(privateTitle)).toHaveCount(0);
  const denied = await page.request.get(
    "/api/privado/registros/00000000-0000-4000-8000-000000000001",
  );
  expect(denied.status()).toBe(401);
  await login(page, "test-reviewer");
  await expect(page.getByRole("heading", { name: privateTitle })).toHaveCount(
    1,
  );
  await page.getByRole("heading", { name: privateTitle }).click();
  await expect(page.getByText(privateText, { exact: true })).toBeVisible();
  const reportId = new URL(page.url()).pathname.split("/").at(-1)!;
  expect(
    (
      await page.request.post(
        `/api/privado/registros/${reportId}/publicacion`,
        {
          headers: { origin },
          data: {
            title: publicTitle,
            body: "Texto ficticio que no tiene confirmación humana.",
            privacyConfirmed: false,
            publicationConfirmed: true,
            version: 1,
          },
        },
      )
    ).status(),
  ).toBe(400);
  await page
    .getByRole("checkbox", { name: /Revisé la información y confirmo/ })
    .check();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Validar sin publicar" }).click();
  await expect(
    page.getByText("Validado internamente", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Título público").fill(publicTitle);
  await page
    .getByLabel("Versión pública revisada")
    .fill(
      "Síntesis ficticia revisada por una persona, sin el contenido original restringido.",
    );
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  await page.screenshot({
    path: "artifacts/revision-desktop.png",
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Aprobar y publicar esta versión" })
    .click();
  await expect(
    page.getByText("Versión pública aprobada", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await page.request.post(
        `/api/privado/registros/${reportId}/publicacion`,
        {
          headers: { origin },
          data: {
            title: publicTitle,
            body: "Intento ficticio de sobrescribir una publicación aprobada.",
            privacyConfirmed: true,
            publicationConfirmed: true,
            version: 1,
          },
        },
      )
    ).status(),
  ).toBe(409);
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${origin}/denuncias`);
  await expect(
    publicPage.getByRole("heading", { name: publicTitle }),
  ).toBeVisible();
  await expect(publicPage.getByText(privateText)).toHaveCount(0);
  await expect(publicPage.getByText(privateTitle)).toHaveCount(0);
  await publicPage.getByRole("heading", { name: publicTitle }).click();
  await expect(publicPage.getByText(privateText)).toHaveCount(0);
  expect(
    (
      await publicPage.request.get(`/api/privado/registros/${reportId}`)
    ).status(),
  ).toBe(401);
  await publicContext.close();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/ingreso$/);
  expect(
    (await page.request.get(`/api/privado/registros/${reportId}`)).status(),
  ).toBe(401);
});
test("draft persists; another participant and reviewer cannot access it; participant cannot publish", async ({
  page,
  browser,
}) => {
  await login(page, "test-participant");
  await page.getByRole("link", { name: "Nuevo registro" }).click();
  const title = `Borrador ficticio ${prefix}`;
  await page.getByLabel("Título breve").fill(title);
  await page
    .getByLabel("Descripción")
    .fill("Relato ficticio conservado en un borrador privado.");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Título breve")).toHaveValue(title);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, "test-other");
  expect(
    (await otherPage.request.get(`/api/privado/registros/${id}`)).status(),
  ).toBe(404);
  expect(
    (
      await otherPage.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title: "Cambio no autorizado",
          description: "",
          submit: false,
          version: 1,
        },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await otherPage.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await other.close();
  const reviewer = await browser.newContext();
  const reviewerPage = await reviewer.newPage();
  await login(reviewerPage, "test-reviewer");
  expect(
    (await reviewerPage.request.get(`/api/privado/registros/${id}`)).status(),
  ).toBe(404);
  await reviewer.close();
  const stale = await page.request.patch(`/api/privado/registros/${id}`, {
    headers: { origin },
    data: {
      title,
      description: "Texto ficticio suficientemente extenso.",
      submit: false,
      version: 99,
    },
  });
  expect(stale.status()).toBe(409);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(
    page.getByText("Pendiente de revisión", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await page.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title,
          description: "Cambio después del envío.",
          submit: false,
          version: 2,
        },
      })
    ).status(),
  ).toBe(409);
});
test("disabled accounts, origin checks, body limits and rate limiting", async ({
  page,
}) => {
  const noOrigin = await page.request.post("/api/auth/login", {
    data: { username: "test-reviewer", password },
  });
  expect(noOrigin.status()).toBe(403);
  const disabled = await page.request.post("/api/auth/login", {
    headers: { origin },
    data: { username: `${prefix}-disabled`, password },
  });
  expect(disabled.status()).toBe(401);
  const big = await page.request.post("/api/denuncias", {
    headers: { origin },
    data: { description: "x".repeat(27000) },
  });
  expect(big.status()).toBe(413);
  const statuses = [];
  for (let i = 0; i < 12; i++)
    statuses.push(
      (
        await page.request.post("/api/auth/login", {
          headers: { origin },
          data: { username: `${prefix}-nonexistent`, password: "wrong" },
        })
      ).status(),
    );
  expect(statuses).toContain(429);
});
test("mobile layout and keyboard reachability", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/denuncia", "/denuncias", "/ingreso"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/denuncia");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.getByLabel("Título breve").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("¿Qué ocurrió?")).toBeFocused();
});
