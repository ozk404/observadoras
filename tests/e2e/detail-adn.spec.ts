import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect } from "./fixtures";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
test("report detail separates original, AI and human decisions across responsive states", async ({
  page,
}) => {
  test.skip(!process.env.TEST_PASSWORD, "Requires isolated fixtures.");
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { origin },
        data: {
          username: `${prefix}-reviewer`,
          password: process.env.TEST_PASSWORD,
        },
      })
    ).status(),
  ).toBe(200);
  const key = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  const created = await page.request.post("/api/denuncias", {
    headers: { origin },
    multipart: {
      description:
        "Reporte enteramente ficticio sobre desinformación dirigida a una candidata inventada. Esta imagen es una prueba de diseño sin personas ni hechos reales.",
      sourceUrl: "https://example.test/publicacion-ficticia",
      consent: "true", consentVersion: AI_CONSENT_VERSION,
      website: "",
      token,
      submissionKey: key,
      evidence: await imageFixture(),
    },
  });
  expect(created.status()).toBe(201);
  await page.goto("/equipo");
  await page
    .getByRole("heading", {
      name: `Reporte recibido · ${key.slice(0, 8)}`,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await expect(
    page.getByRole("heading", { name: "Reporte recibido", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Análisis inicial de IA" }),
  ).toBeVisible();
  await expect(page.locator("details.extra-analysis")).not.toHaveAttribute(
    "open",
  );
  await expect(page.locator("main")).not.toContainText("simulated-model");
  const image = page.getByRole("img", { name: "Imagen adjunta al reporte" });
  await expect(image).toHaveCSS("object-fit", "contain");
  await image.click();
  await expect(
    page.getByRole("dialog", { name: "Captura adjunta" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/ficha-pendiente-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("checkbox", { name: "Desinformación", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: /Revisé la información y confirmo/ })
    .check();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Validar sin publicar" }).click();
  await expect(
    page.getByText("Validado internamente", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Título público")).toBeVisible();
  await expect(page.getByRole("region", { name: "Seguimiento" })).toBeVisible();
  await page.screenshot({
    path: "artifacts/ficha-validada-1440.png",
    fullPage: true,
  });
  const report = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: {
          title: `Publicación ficticia ${prefix}`,
          body: "Síntesis pública completamente ficticia para verificar la separación visual y privada del reporte.",
          version: report.version,
          privacyConfirmed: true,
          publicationConfirmed: true,
        },
      })
    ).status(),
  ).toBe(201);
  await page.reload();
  await expect(
    page.getByText("Versión pública aprobada", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Título público")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/ficha-publicada-1440.png",
    fullPage: true,
  });
  for (const link of await page
    .getByRole("navigation", { name: "Secciones del reporte" })
    .getByRole("link")
    .all()) {
    const href = await link.getAttribute("href");
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await page.route(`**/api/privado/registros/${id}/evidencia`, (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Captura no disponible" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Descripción", exact: true }),
  ).toBeVisible();
});
