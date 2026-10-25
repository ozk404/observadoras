import { test, expect, type Page } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
test.skip(
  process.env.TEST_AI !== "true",
  "Requires the dedicated, explicitly simulated AI Compose environment.",
);
async function login(page: Page, role = "reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page.getByLabel("Contraseña").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function createPending(page: Page, suffix: string) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Registro ficticio ${prefix} ${suffix}`,
      description:
        "Relato privado ficticio con correo original@example.test que no debe enviarse al proveedor.",
      submit: true,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
const input = (text: string) => ({
  text,
  version: 1,
  privacyConfirmed: true,
  syntheticConfirmed: true,
});
async function validate(page: Page) {
  await page
    .getByRole("checkbox", { name: /Revisé la información y confirmo/ })
    .check();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Validar sin publicar" }).click();
  await expect(
    page.getByText("Validado internamente", { exact: true }),
  ).toBeVisible();
}
test("prepared input only; suggestions persist; human edits and approvals remain independent", async ({
  page,
  browser,
}) => {
  await login(page);
  const id = await createPending(page, "sugerencia");
  await page.goto(`/equipo/${id}`);
  await expect(page.getByLabel("Texto preparado para IA")).toHaveValue("");
  await page
    .getByLabel("Texto preparado para IA")
    .fill(
      "Un texto ficticio que incluye correo prueba@example.test para comprobar el bloqueo.",
    );
  await expect(
    page.getByRole("button", { name: "Solicitar sugerencias", exact: true }),
  ).toBeDisabled();
  const blocked = await page.request.post(
    `/api/privado/registros/${id}/analisis`,
    {
      headers: { origin },
      data: input(
        "Un texto ficticio con correo prueba@example.test para comprobar el bloqueo.",
      ),
    },
  );
  expect(blocked.status()).toBe(400);
  expect(
    await (
      await page.request.get(`/api/privado/registros/${id}/analisis`)
    ).json(),
  ).toEqual([]);
  const missing = await page.request.post(
    `/api/privado/registros/${id}/analisis`,
    {
      headers: { origin },
      data: {
        ...input("Un relato ficticio suficientemente amplio para el análisis."),
        syntheticConfirmed: false,
      },
    },
  );
  expect(missing.status()).toBe(400);
  const stale = await page.request.post(
    `/api/privado/registros/${id}/analisis`,
    {
      headers: { origin },
      data: {
        ...input("Un relato ficticio suficientemente amplio para el análisis."),
        version: 99,
      },
    },
  );
  expect(stale.status()).toBe(409);
  await page
    .getByLabel("Texto preparado para IA")
    .fill(
      "Un relato ficticio sobre desinformación que puede limitar la participación de las mujeres.",
    );
  await page.getByRole("checkbox", { name: /Revisé este texto/ }).check();
  await page
    .getByRole("checkbox", { name: /Confirmo que este contenido es ficticio/ })
    .check();
  await page
    .getByRole("button", { name: "Solicitar sugerencias", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resumen interno sugerido" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Simulación de IA — pendiente de revisión", { exact: true }),
  ).toBeVisible();
  const report = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(report.status).toBe("pending");
  expect(report.description).toContain("original@example.test");
  expect(report.version).toBe(1);
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await login(other, "participant");
  expect(
    (await other.request.get(`/api/privado/registros/${id}/analisis`)).status(),
  ).toBe(403);
  expect(
    (
      await other.request.post(`/api/privado/registros/${id}/analisis`, {
        headers: { origin },
        data: input("Relato ficticio que no está autorizado para esta cuenta."),
      })
    ).status(),
  ).toBe(403);
  await otherContext.close();
  await validate(page);
  const title = `Versión humana ficticia ${prefix}`;
  await page.getByLabel("Título público").fill(title);
  await page
    .getByLabel("Versión pública revisada")
    .fill("Borrador manual ficticio que se sustituirá de forma explícita.");
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Usar resumen como borrador público" })
    .click();
  await expect(page.getByLabel("Título público")).toHaveValue(title);
  await expect(page.getByLabel("Versión pública revisada")).toHaveValue(
    /Se describe una situación ficticia/,
  );
  await expect(
    page.getByRole("checkbox", { name: /Revisé los hechos/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Apruebo explícitamente/ }),
  ).not.toBeChecked();
  const humanText =
    "Texto final ficticio editado por una persona para publicar con criterio humano y sin el original.";
  await page.getByLabel("Versión pública revisada").fill(humanText);
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  await page.screenshot({
    path: "artifacts/ia-revision-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/ia-revision-mobile.png",
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Aprobar y publicar esta versión" })
    .click();
  await expect(
    page.getByText("Versión pública aprobada", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Resumen interno sugerido" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Solicitar sugerencias", exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/analisis`, {
        headers: { origin },
        data: input(
          "No debe reemplazarse una publicación humana con otro análisis.",
        ),
      })
    ).status(),
  ).toBe(409);
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${origin}/denuncias`);
  await publicPage.getByRole("heading", { name: title }).click();
  await expect(publicPage).toHaveURL(/\/denuncias\/[a-f0-9-]+$/);
  await expect(publicPage.locator(".report-body")).toHaveText(humanText);
  await expect(
    publicPage.getByText("original@example.test", { exact: false }),
  ).toHaveCount(0);
  await publicContext.close();
});
test("provider failure and invalid response preserve the original and manual publication", async ({
  page,
}) => {
  await login(page);
  const id = await createPending(page, "fallo");
  for (const text of [
    "Un relato ficticio para simular fallo del proveedor externo.",
    "Un relato ficticio para simular respuesta invalida del proveedor.",
  ]) {
    expect(
      (
        await page.request.post(`/api/privado/registros/${id}/analisis`, {
          headers: { origin },
          data: input(text),
        })
      ).status(),
    ).toBe(502);
  }
  const analyses = await (
    await page.request.get(`/api/privado/registros/${id}/analisis`)
  ).json();
  expect(analyses.map((a: { error_code: string }) => a.error_code)).toEqual([
    "invalid_response",
    "unavailable",
  ]);
  expect(analyses.every((a: { result: unknown }) => a.result === null)).toBe(
    true,
  );
  await page.goto(`/equipo/${id}`);
  await expect(
    page.getByText(
      "No se recibió una sugerencia válida. Puedes continuar manualmente.",
      { exact: true },
    ),
  ).toBeVisible();
  await validate(page);
  await page
    .getByLabel("Título público")
    .fill(`Publicación manual ficticia ${prefix}`);
  await page
    .getByLabel("Versión pública revisada")
    .fill(
      "Contenido ficticio preparado manualmente después de un fallo, sin perder el registro original.",
    );
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Aprobar y publicar esta versión" })
    .click();
  await expect(
    page.getByText("Versión pública aprobada", { exact: true }),
  ).toBeVisible();
});
test("concurrent analysis is limited and a result arriving after human publication is discarded", async ({
  page,
}) => {
  await login(page);
  const id = await createPending(page, "concurrencia");
  const endpoint = `/api/privado/registros/${id}/analisis`;
  const requests = await Promise.all([
    page.request.post(endpoint, {
      headers: { origin },
      data: input(
        "Un relato ficticio para simular espera y probar concurrencia.",
      ),
    }),
    page.request.post(endpoint, {
      headers: { origin },
      data: input(
        "Un relato ficticio para simular espera y probar concurrencia.",
      ),
    }),
  ]);
  expect(requests.map((r) => r.status()).sort()).toEqual([201, 409]);
  const staleId = await createPending(page, "obsoleto");
  const pending = page.request.post(
    `/api/privado/registros/${staleId}/analisis`,
    {
      headers: { origin },
      data: input(
        "Un relato ficticio para simular espera durante una decisión humana.",
      ),
    },
  );
  await expect
    .poll(async () => {
      const rows = await (
        await page.request.get(`/api/privado/registros/${staleId}/analisis`)
      ).json();
      return rows[0]?.status;
    })
    .toBe("running");
  expect(
    (
      await page.request.post(`/api/privado/registros/${staleId}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 1 },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post(`/api/privado/registros/${staleId}/publicacion`, {
        headers: { origin },
        data: {
          title: "Versión ficticia aprobada durante análisis",
          body: "Texto ficticio aprobado por una persona que no debe modificarse cuando termine la solicitud.",
          privacyConfirmed: true,
          publicationConfirmed: true,
          version: 2,
        },
      })
    ).status(),
  ).toBe(201);
  expect((await pending).status()).toBe(409);
  const rows = await (
    await page.request.get(`/api/privado/registros/${staleId}/analisis`)
  ).json();
  expect(rows[0].error_code).toBe("stale");
  expect(rows[0].result).toBeNull();
});
