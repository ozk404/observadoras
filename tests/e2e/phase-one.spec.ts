import { test, expect } from "@playwright/test";
import { imageFixture } from "../image-fixture";
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
  await page.getByLabel("Contraseña", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
test("public intake → private human review → separately approved public version", async ({
  page,
  browser,
}) => {
  const submissionKey = crypto.randomUUID();
  await page.addInitScript((key) => {
    Object.defineProperty(crypto, "randomUUID", { value: () => key });
  }, submissionKey);
  const unique = prefix;
  const privateText = `Texto privado de prueba ${unique}, que no debe aparecer en el catálogo público.`;
  const publicTitle = `Versión revisada ficticia ${unique}`;
  await page.goto("/reportar");
  const fixture = await imageFixture();
  await page.getByLabel("Captura o imagen").setInputFiles(fixture);
  await page
    .getByLabel("URL de la publicación o fuente")
    .fill("https://example.test/fuente-privada");
  await page.getByLabel("Descripción de lo ocurrido").fill(privateText);
  await page.getByRole("checkbox", { name: /Acepto el/ }).check();
  await expect(
    page.getByRole("button", { name: "Enviar a revisión" }),
  ).toBeEnabled();
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu reporte fue recibido." }),
  ).toBeVisible();
  expect(submissionKey).toMatch(/^[a-f0-9-]{36}$/);
  const privateTitle = `Reporte recibido · ${submissionKey.slice(0, 8)}`;
  const retryToken = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description: privateText,
          sourceUrl: "https://example.test/fuente-privada",
          consent: "true",

          website: "",
          token: retryToken.token,
          submissionKey,
          evidence: fixture,
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/reportes");
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
  const evidence = await page.request.get(
    `/api/privado/registros/${reportId}/evidencia`,
  );
  expect(evidence.status()).toBe(200);
  expect(evidence.headers()["content-type"]).toBe("image/webp");
  expect(evidence.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("img", { name: "Imagen adjunta al reporte" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir URL de la fuente" }),
  ).toHaveAttribute("href", "https://example.test/fuente-privada");
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await login(other, "test-participant");
  expect(
    (
      await other.request.get(`/api/privado/registros/${reportId}/evidencia`)
    ).status(),
  ).toBe(404);
  await otherContext.close();
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
  await publicPage.goto(`${origin}/reportes`);
  await expect(
    publicPage.getByRole("heading", { name: publicTitle }),
  ).toBeVisible();
  await expect(publicPage.getByText(privateText)).toHaveCount(0);
  await expect(publicPage.getByText(privateTitle)).toHaveCount(0);
  await publicPage.getByRole("heading", { name: publicTitle }).click();
  await expect(publicPage).toHaveURL(/\/reportes\/[a-f0-9-]+$/);
  await expect(publicPage.getByText(privateText)).toHaveCount(0);
  await expect(
    publicPage.getByRole("img", {
      name: "Imagen adjunta al reporte",
    }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByRole("link", { name: "Abrir URL de la fuente" }),
  ).toHaveCount(0);
  expect(
    (
      await publicPage.request.get(
        `/api/privado/registros/${reportId}/evidencia`,
      )
    ).status(),
  ).toBe(401);
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
  const title = `Borrador ficticio ${prefix}`;
  const created = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title,
      description: "Relato ficticio conservado en un borrador privado.",
      submit: false,
    },
  });
  expect(created.status()).toBe(201);
  const draftId = (await created.json()).id;
  await page.goto(`/equipo/${draftId}`);
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
  expect(big.status()).toBe(415);
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
  for (const path of ["/", "/reportar", "/reportes", "/ingreso"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/reportar");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.getByLabel("URL de la publicación o fuente").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Descripción de lo ocurrido")).toBeFocused();
});

test("private forms cannot submit before JavaScript is ready", async ({
  page,
  browser,
}) => {
  await login(page, "test-participant");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    storageState: await page.context().storageState(),
  });
  const draft = await context.newPage();
  const created = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Borrador previo ${prefix}`,
      description: "",
      submit: false,
    },
  });
  expect(created.status()).toBe(201);
  await draft.goto(`/equipo/${(await created.json()).id}`);
  await expect(draft.getByLabel("Título breve")).toBeDisabled();
  await expect(draft.getByLabel("Descripción")).toBeDisabled();
  await expect(
    draft.getByRole("button", { name: "Guardar borrador" }),
  ).toBeDisabled();
  await expect(draft.locator("form")).toHaveAttribute("method", "post");
  await context.close();
  const anonymous = await browser.newContext({ javaScriptEnabled: false });
  const entry = await anonymous.newPage();
  await entry.goto("/ingreso");
  await expect(entry.getByLabel("Contraseña", { exact: true })).toBeDisabled();
  await expect(
    entry.getByRole("button", { name: "Ingresar al área privada" }),
  ).toBeDisabled();
  await expect(entry.locator("form")).toHaveAttribute("method", "post");
  await anonymous.close();
});
