import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect, type Page } from "./fixtures";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const prefix = process.env.TEST_PREFIX ?? "test";
test.skip(
  process.env.TEST_AI !== "true",
  "Requires the isolated simulated provider.",
);
async function submit(page: Page, description: string) {
  const submissionKey = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  const response = await page.request.post("/api/denuncias", {
    headers: { origin },
    multipart: {
      description,
      consent: "true",
      consentVersion: AI_CONSENT_VERSION,

      website: "",
      token,
      submissionKey,
      evidence: await imageFixture(),
    },
  });
  expect(response.status()).toBe(201);
  await page.goto("/equipo");
  await page
    .getByRole("heading", {
      name: `Reporte recibido · ${submissionKey.slice(0, 8)}`,
    })
    .click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]{36}$/);
  return new URL(page.url()).pathname.split("/").at(-1)!;
}
async function login(page: Page) {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-intake-reviewer`);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
test("receipt automatically analyzes screenshot, exposes private insights and preserves human classification", async ({
  page,
  browser,
}) => {
  await login(page);
  const id = await submit(
    page,
    "Caso completamente ficticio de desinformación para limitar la participación política de las mujeres.",
  );
  const endpoint = `/api/privado/registros/${id}/analisis-inicial`;
  await expect
    .poll(async () => (await (await page.request.get(endpoint)).json()).state, {
      timeout: 20000,
    })
    .toBe("completed");
  const analysis = await (await page.request.get(endpoint)).json();
  expect(analysis.result.assessment).toBe("needs_context");
  expect(analysis.result.evidenceNotes).toContain("captura");
  await expect(
    page.getByRole("heading", { name: "Observaciones sobre la captura" }),
  ).toBeVisible();
  const visitor = await browser.newContext();
  expect((await visitor.request.get(`${origin}${endpoint}`)).status()).toBe(
    401,
  );
  await visitor.close();
  const participant = await browser.newContext();
  await participant.request.post(`${origin}/api/auth/login`, {
    headers: { origin },
    data: {
      username: `${prefix}-participant`,
      password: process.env.TEST_PASSWORD!,
    },
  });
  expect((await participant.request.get(`${origin}${endpoint}`)).status()).toBe(
    403,
  );
  await participant.close();
  await page
    .getByRole("checkbox", { name: "Desinformación", exact: true })
    .check();
  await page
    .getByLabel(/Observación interna de la revisora/)
    .fill("Clasificación humana independiente del análisis automático.");
  await page
    .getByRole("checkbox", { name: /Revisé la información y confirmo/ })
    .check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Validar sin publicar" }).click();
  await expect(
    page.getByText("Validado internamente", { exact: true }),
  ).toBeVisible();
  const report = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(report.status).toBe("validated");
  expect(report.reviewed_categories).toEqual(["desinformacion"]);
  expect(report.review_observation).toContain("humana");
  await page.screenshot({
    path: "artifacts/intake-reviewer.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/intake-reviewer-mobile.png",
    fullPage: true,
  });
});
test("provider failure permits manual review; authorized intake is not blocked by an email in the original", async ({
  page,
}) => {
  await login(page);
  const id = await submit(
    page,
    "Relato completamente ficticio para simular fallo del proveedor sin perder la denuncia recibida.",
  );
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get(
              `/api/privado/registros/${id}/analisis-inicial`,
            )
          ).json()
        ).state,
      { timeout: 25000 },
    )
    .toBe("failed");
  const failed = await (
    await page.request.get(`/api/privado/registros/${id}/analisis-inicial`)
  ).json();
  expect(failed.attempts).toBe(2);
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { version: 1, confirmed: true },
      })
    ).status(),
  ).toBe(200);
  const sensitive = await submit(
    page,
    "Ejemplo ficticio autorizado con correo prueba@example.test para revisar información sensible en privado.",
  );
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get(
              `/api/privado/registros/${sensitive}/analisis-inicial`,
            )
          ).json()
        ).state,
      { timeout: 15000 },
    )
    .toBe("completed");
  const analysis = await (
    await page.request.get(
      `/api/privado/registros/${sensitive}/analisis-inicial`,
    )
  ).json();
  expect(analysis.error_code).toBeNull();
  expect(analysis.result).not.toBeNull();
});

test("a response arriving after human validation is discarded without overwriting the review", async ({
  page,
}) => {
  await login(page);
  const id = await submit(
    page,
    "Relato ficticio para simular demora inicial del análisis de la captura sin cambiar la decisión humana.",
  );
  const endpoint = `/api/privado/registros/${id}/analisis-inicial`;
  await expect
    .poll(async () => (await (await page.request.get(endpoint)).json()).state, {
      timeout: 10000,
      intervals: [100, 200],
    })
    .toBe("processing");
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: {
          version: 1,
          confirmed: true,
          reviewObservation:
            "Revisión manual terminada mientras se esperaba al proveedor.",
        },
      })
    ).status(),
  ).toBe(200);
  await expect
    .poll(async () => (await (await page.request.get(endpoint)).json()).state, {
      timeout: 10000,
    })
    .toBe("superseded");
  expect((await (await page.request.get(endpoint)).json()).result).toBeNull();
  expect(
    (await (await page.request.get(`/api/privado/registros/${id}`)).json())
      .status,
  ).toBe("validated");
});
