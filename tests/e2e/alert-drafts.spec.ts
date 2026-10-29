import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect, type Page } from "@playwright/test";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const prefix = process.env.TEST_PREFIX ?? "test";
const endpoint = (id: string) => `/api/privado/registros/${id}/borrador-alerta`;
const content = {
  title: "Alerta interna ficticia",
  body: "Texto de alerta ficticia preparado para revisión humana sin difusión.",
};
async function login(page: Page, role = "alert-reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function create(page: Page, submit = true) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Caso ficticio de alerta ${prefix}`,
      description:
        "Relato ficticio privado para comprobar los borradores internos de alertas.",
      submit,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
async function validate(page: Page, id: string, version = 1) {
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version },
      })
    ).status(),
  ).toBe(200);
}
async function context(page: Page, id: string) {
  const response = await page.request.get(endpoint(id));
  expect(response.status()).toBe(200);
  return response.json();
}
async function save(
  page: Page,
  id: string,
  data: unknown,
  requestOrigin = origin,
) {
  return page.request.post(endpoint(id), {
    headers: { origin: requestOrigin },
    data,
  });
}

test("manual alert draft persists and remains editable with closed follow-up without publishing or changing the original", async ({
  page,
}) => {
  await login(page);
  const id = await create(page);
  await validate(page, id);
  await page.goto(`/equipo/${id}`);
  const panel = page.getByRole("region", { name: "Borrador de alerta" });
  await expect(
    panel.getByRole("button", { name: "Usar resumen de IA" }),
  ).toHaveCount(0);
  const followup = page.getByRole("region", { name: "Seguimiento" });
  await followup
    .getByRole("button", { name: "Cerrar seguimiento", exact: true })
    .click();
  await followup
    .getByLabel("Motivo del cierre")
    .fill("Cierre ficticio antes de redactar una alerta interna.");
  page.once("dialog", (dialog) => dialog.accept());
  await followup.getByRole("button", { name: "Confirmar cierre" }).click();
  await expect(followup.getByText("Cerrado", { exact: true })).toBeVisible();
  await panel.getByLabel("Título de alerta").fill(content.title);
  await panel.getByLabel("Texto de alerta").fill(content.body);
  await panel.getByLabel("Texto de alerta").focus();
  await page.keyboard.press("Tab");
  await expect(
    panel.getByRole("button", { name: "Guardar borrador" }),
  ).toBeFocused();
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(
    panel.getByRole("button", { name: "Guardar borrador" }),
  ).toBeDisabled();
  await expect
    .poll(async () => (await context(page, id)).draft?.version)
    .toBe(1);
  await page.reload();
  await expect(panel.getByLabel("Texto de alerta")).toHaveValue(content.body);
  const edited = content.body + " Corrección humana posterior.";
  await panel.getByLabel("Texto de alerta").fill(edited);
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect
    .poll(async () => (await context(page, id)).draft?.version)
    .toBe(2);
  const saved = (await context(page, id)).draft;
  expect(saved.body).toBe(edited);
  expect(saved.source).toBeNull();
  expect(saved.editor_username).toBe(`${prefix}-alert-reviewer`);
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.status).toBe("validated");
  expect(record.version).toBe(3);
  expect(record.description).toBe(
    "Relato ficticio privado para comprobar los borradores internos de alertas.",
  );
  await page.screenshot({
    path: "artifacts/alert-draft-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/alert-draft-mobile.png",
    fullPage: true,
  });
});

test("existing initial AI summary is used only explicitly, edited and saved with provenance", async ({
  page,
}) => {
  test.skip(
    process.env.TEST_AI !== "true",
    "Requires the simulated AI environment.",
  );
  await login(page);
  const submissionKey = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description:
            "Relato ficticio de desinformación para probar una alerta privada a partir de un resumen existente.",
          website: "",
          consent: "true", consentVersion: AI_CONSENT_VERSION,

          token,
          submissionKey,
          evidence: await imageFixture(),
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/equipo");
  await page
    .getByRole("heading", {
      name: `Reporte recibido · ${submissionKey.slice(0, 8)}`,
    })
    .click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
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
      { timeout: 20000 },
    )
    .toBe("completed");
  await validate(page, id);
  await page.reload();
  const panel = page.getByRole("region", { name: "Borrador de alerta" });
  const value = await context(page, id);
  expect(value.draft).toBeNull();
  await expect(panel.getByLabel("Texto de alerta")).toHaveValue("");
  await panel.getByRole("button", { name: "Usar resumen de IA" }).click();
  await expect(panel.getByLabel("Texto de alerta")).toHaveValue(
    value.base.summary,
  );
  await expect(panel.getByLabel("Título de alerta")).toHaveValue("");
  expect((await context(page, id)).draft).toBeNull();
  await panel
    .getByLabel("Título de alerta")
    .fill("Alerta ficticia revisada por una persona");
  const edited = value.base.summary + " Texto editado por la revisora.";
  await panel.getByLabel("Texto de alerta").fill(edited);
  page.once("dialog", (dialog) => dialog.dismiss());
  await panel.getByRole("button", { name: "Usar resumen de IA" }).click();
  await expect(panel.getByLabel("Texto de alerta")).toHaveValue(edited);
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect
    .poll(async () => (await context(page, id)).draft?.version)
    .toBe(1);
  const saved = (await context(page, id)).draft;
  expect(saved.body).toBe(edited);
  expect(saved.source).toEqual(value.base.source);
  expect(
    (await (await page.request.get(`/api/privado/registros/${id}`)).json())
      .status,
  ).toBe("validated");
});

test("draft isolation and version checks prevent forged, unsupported and concurrent overwrites", async ({
  page,
  browser,
}) => {
  await login(page, "alert-participant");
  const id = await create(page);
  const draftId = await create(page, false);
  expect((await page.request.get(endpoint(id))).status()).toBe(403);
  expect(
    (
      await save(page, id, { ...content, reportVersion: 1, draftVersion: 0 })
    ).status(),
  ).toBe(403);
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  await login(reviewer);
  expect(
    (
      await save(reviewer, id, {
        ...content,
        reportVersion: 1,
        draftVersion: 0,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await save(reviewer, draftId, {
        ...content,
        reportVersion: 1,
        draftVersion: 0,
      })
    ).status(),
  ).toBe(404);
  await validate(reviewer, id);
  const payload = { ...content, reportVersion: 2, draftVersion: 0 };
  expect(
    (await save(reviewer, id, { ...payload, updated_by: "forged" })).status(),
  ).toBe(400);
  expect(
    (await save(reviewer, id, payload, "https://foreign.test")).status(),
  ).toBe(403);
  expect(
    (await save(reviewer, id, { ...payload, reportVersion: 1 })).status(),
  ).toBe(409);
  expect(
    (
      await save(reviewer, id, {
        ...payload,
        source: { kind: "initial", id: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(409);
  const creates = await Promise.all([
    save(reviewer, id, payload),
    save(reviewer, id, payload),
  ]);
  expect(creates.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  await login(second, "followup-reviewer");
  await second.goto(`/equipo/${id}`);
  const secondPanel = second.getByRole("region", {
    name: "Borrador de alerta",
  });
  const localText =
    "Texto local ficticio que debe conservarse cuando otra revisora guarda primero.";
  await secondPanel.getByLabel("Texto de alerta").fill(localText);
  expect(
    (
      await save(reviewer, id, {
        ...payload,
        draftVersion: 1,
        body: "Texto nuevo ficticio guardado por la primera revisora.",
      })
    ).status(),
  ).toBe(200);
  await secondPanel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(secondPanel.getByRole("alert")).toContainText("Otra revisora");
  await expect(secondPanel.getByLabel("Texto de alerta")).toHaveValue(
    localText,
  );
  const edits = await Promise.all([
    save(reviewer, id, {
      ...payload,
      draftVersion: 2,
      body: "Edición simultánea ficticia número uno del borrador.",
    }),
    save(second, id, {
      ...payload,
      draftVersion: 2,
      body: "Edición simultánea ficticia número dos del borrador.",
    }),
  ]);
  expect(edits.map((response) => response.status()).sort()).toEqual([200, 409]);
  await page.goto(`/equipo/${id}`);
  await expect(
    page.getByRole("region", { name: "Borrador de alerta" }),
  ).toHaveCount(0);
  expect(
    JSON.stringify(
      await (await page.request.get(`/api/privado/registros/${id}`)).json(),
    ),
  ).not.toContain("Edición simultánea");
  const published = await reviewer.request.post(
    `/api/privado/registros/${id}/publicacion`,
    {
      headers: { origin },
      data: {
        version: 2,
        title: `Publicación independiente de alerta ${prefix}`,
        body: "Versión pública ficticia aprobada por separado del borrador interno.",
        privacyConfirmed: true,
        publicationConfirmed: true,
      },
    },
  );
  expect(published.status()).toBe(201);
  expect(
    (
      await save(reviewer, id, {
        ...payload,
        reportVersion: 3,
        draftVersion: 3,
        body: "Texto de alerta interna ficticia posterior a la publicación.",
      })
    ).status(),
  ).toBe(200);
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto(`${origin}/reportes`);
  await publicPage
    .getByRole("heading", {
      name: `Publicación independiente de alerta ${prefix}`,
    })
    .click();
  await expect(publicPage).toHaveURL(/\/reportes\/[a-f0-9-]{36}$/);
  await expect(
    publicPage.getByText(
      "Versión pública ficticia aprobada por separado del borrador interno.",
    ),
  ).toBeVisible();
  expect(await publicPage.locator("body").innerText()).not.toContain(
    "Texto de alerta interna",
  );
  expect((await visitor.request.get(`${origin}${endpoint(id)}`)).status()).toBe(
    401,
  );
  await visitor.close();
  await reviewerContext.close();
  await secondContext.close();
});

test("prepared AI bases reject failed, foreign and superseded analyses while manual drafts remain available", async ({
  page,
}) => {
  test.skip(
    process.env.TEST_AI !== "true",
    "Requires the simulated AI environment.",
  );
  await login(page);
  const id = await create(page);
  const analysisEndpoint = `/api/privado/registros/${id}/analisis`;
  const input = (text: string) => ({
    text,
    privacyConfirmed: true,

    version: 1,
  });
  expect(
    (
      await page.request.post(analysisEndpoint, {
        headers: { origin },
        data: input(
          "Relato ficticio para simular fallo del proveedor durante una prueba.",
        ),
      })
    ).status(),
  ).toBe(502);
  const failed = (await (await page.request.get(analysisEndpoint)).json())[0];
  const success = await page.request.post(analysisEndpoint, {
    headers: { origin },
    data: input(
      "Relato ficticio de desinformación para preparar un resumen orientativo.",
    ),
  });
  expect(success.status()).toBe(201);
  const analysis = await success.json();
  await validate(page, id);
  const payload = { ...content, reportVersion: 2, draftVersion: 0 };
  expect(
    (
      await save(page, id, {
        ...payload,
        source: { kind: "prepared", id: failed.id },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await save(page, id, {
        ...payload,
        source: { kind: "prepared", id: analysis.id },
      })
    ).status(),
  ).toBe(200);
  expect((await context(page, id)).base.source).toEqual({
    kind: "prepared",
    id: analysis.id,
  });
  const otherId = await create(page);
  const old = await page.request.post(
    `/api/privado/registros/${otherId}/analisis`,
    {
      headers: { origin },
      data: input(
        "Relato ficticio con un resumen que dejará de estar vigente tras ajustes.",
      ),
    },
  );
  expect(old.status()).toBe(201);
  const oldAnalysis = await old.json();
  expect(
    (
      await page.request.post(`/api/privado/registros/${otherId}/ajustes`, {
        headers: { origin },
        data: {
          version: 1,
          confirmed: true,
          note: "Completa el contexto ficticio para volver a revisar el registro.",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.patch(`/api/privado/registros/${otherId}`, {
        headers: { origin },
        data: {
          version: 2,
          title: "Registro ficticio corregido",
          description:
            "Relato ficticio corregido con más contexto para revisión del equipo.",
          submit: true,
        },
      })
    ).status(),
  ).toBe(200);
  await validate(page, otherId, 3);
  expect((await context(page, otherId)).base).toBeNull();
  expect(
    (
      await save(page, otherId, {
        ...payload,
        reportVersion: 4,
        source: { kind: "prepared", id: oldAnalysis.id },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await save(page, otherId, {
        ...payload,
        reportVersion: 4,
        source: { kind: "prepared", id: analysis.id },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await save(page, otherId, { ...payload, reportVersion: 4 })).status(),
  ).toBe(200);
});
