import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect, type Page } from "./fixtures";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(page: Page, role: string) {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function create(page: Page, suffix: string, submit = true) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Ajustes ficticios ${prefix} ${suffix}`,
      description:
        "Relato interno ficticio para comprobar corrección y revisión humana.",
      submit,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
async function get(page: Page, id: string) {
  const response = await page.request.get(`/api/privado/registros/${id}`);
  expect(response.status()).toBe(200);
  return response.json();
}
test("author saves and resubmits corrections; private history survives repeated cycles and publication", async ({
  page,
  browser,
}) => {
  await login(page, "participant");
  const id = await create(page, "recorrido");
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  await login(reviewer, "reviewer");
  await reviewer.goto(`/equipo/${id}`);
  const note =
    "Aclara el contexto ficticio y distingue el hecho de las interpretaciones, sin datos personales.";
  await reviewer
    .getByText("Solicitar correcciones a la autora", { exact: true })
    .click();
  await reviewer.getByLabel("¿Qué debe corregirse?").fill(note);
  await reviewer
    .getByRole("checkbox", { name: /Confirmo que el registro necesita/ })
    .check();
  reviewer.once("dialog", (d) => d.accept());
  const returned = reviewer.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/privado/registros/${id}/ajustes`) &&
      response.request().method() === "POST",
  );
  await reviewer.getByRole("button", { name: "Devolver para ajustes" }).click();
  const sent = await returned;
  expect(sent.status()).toBe(200);
  expect(await sent.json()).toMatchObject({ id, version: 2 });
  await expect(
    reviewer.getByText("Requiere ajustes", { exact: true }),
  ).toBeVisible();
  await page.goto(`/equipo/${id}`);
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await expect(
    page.getByText(`Por ${prefix}-reviewer`, { exact: false }),
  ).toBeVisible();
  let record = await get(page, id);
  expect(record.status).toBe("needs_adjustments");
  expect(record.version).toBe(2);
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  expect(
    (
      await visitor.request.get(`/api/privado/registros/${id}/ajustes`)
    ).status(),
  ).toBe(401);
  await visitor.goto(`${origin}/reportes`);
  await expect(visitor.getByText(note, { exact: true })).toHaveCount(0);
  await visitorContext.close();
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await login(other, "other");
  expect(
    (await other.request.get(`/api/privado/registros/${id}/ajustes`)).status(),
  ).toBe(404);
  expect(
    (
      await other.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title: "Cambio no permitido",
          description: "Texto ficticio que no debe reemplazar el relato.",
          submit: false,
          version: 2,
        },
      })
    ).status(),
  ).toBe(404);
  await otherContext.close();
  const newTitle = `Corrección ficticia ${prefix}`;
  const newText =
    "Contexto ficticio ampliado y corregido por la autora, sin nombres ni datos personales.";
  await page.getByLabel("Título breve").fill(newTitle);
  await page.getByLabel("Descripción").fill(newText);
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(
    page.getByRole("heading", { name: newTitle, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Descripción")).toHaveValue(newText);
  record = await get(page, id);
  expect(record.status).toBe("needs_adjustments");
  expect(record.version).toBe(3);
  let history = await (
    await page.request.get(`/api/privado/registros/${id}/ajustes`)
  ).json();
  expect(history).toHaveLength(1);
  expect(history[0].resolved_at).toBeNull();
  expect(
    (
      await reviewer.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 3 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await reviewer.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: {
          title: "Título público aún no permitido",
          body: "Este texto ficticio no puede publicarse mientras hay ajustes.",
          privacyConfirmed: true,
          publicationConfirmed: true,
          version: 3,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title: newTitle,
          description: "breve",
          submit: true,
          version: 3,
        },
      })
    ).status(),
  ).toBe(400);
  await page.screenshot({
    path: "artifacts/ajustes-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/ajustes-mobile.png",
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reenviar a revisión" }).click();
  await expect(
    page.getByText("Pendiente de revisión", { exact: true }),
  ).toBeVisible();
  record = await get(page, id);
  expect(record.version).toBe(4);
  expect(record.description).toBe(newText);
  history = await (
    await page.request.get(`/api/privado/registros/${id}/ajustes`)
  ).json();
  expect(history[0].note).toBe(note);
  expect(history[0].resolved_at).toBeTruthy();
  expect(history[0].resolved_by).toBe(record.author_id);
  expect(
    (
      await page.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title: newTitle,
          description: newText,
          submit: false,
          version: 4,
        },
      })
    ).status(),
  ).toBe(409);
  const secondNote =
    "Segundo ajuste ficticio: precisa la diferencia entre contexto y opinión sin añadir identificadores.";
  expect(
    (
      await reviewer.request.post(`/api/privado/registros/${id}/ajustes`, {
        headers: { origin },
        data: { note: secondNote, confirmed: true, version: 4 },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.patch(`/api/privado/registros/${id}`, {
        headers: { origin },
        data: {
          title: newTitle,
          description: newText + " Se diferencia la opinión del hecho.",
          submit: true,
          version: 5,
        },
      })
    ).status(),
  ).toBe(200);
  history = await (
    await page.request.get(`/api/privado/registros/${id}/ajustes`)
  ).json();
  expect(history).toHaveLength(2);
  expect(history.map((h: { note: string }) => h.note)).toEqual([
    secondNote,
    note,
  ]);
  expect(history.every((h: { resolved_at: string }) => !!h.resolved_at)).toBe(
    true,
  );
  expect(
    (
      await reviewer.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { confirmed: true, version: 6 },
      })
    ).status(),
  ).toBe(200);
  const publication = await reviewer.request.post(
    `/api/privado/registros/${id}/publicacion`,
    {
      headers: { origin },
      data: {
        title: `Versión final revisada ${prefix}`,
        body: "Versión pública ficticia preparada después de corregir y validar el registro interno.",
        privacyConfirmed: true,
        publicationConfirmed: true,
        version: 7,
      },
    },
  );
  expect(publication.status()).toBe(201);
  const publicationId = (await publication.json()).id;
  await page.goto(`/reportes/${publicationId}`);
  await expect(page.getByText(note, { exact: true })).toHaveCount(0);
  await expect(page.getByText(secondNote, { exact: true })).toHaveCount(0);
  await expect(page.getByText(newText, { exact: false })).toHaveCount(0);
  await reviewerContext.close();
});
test("requests reject unsupported states, anonymous reports, forged or stale actions and concurrent duplication", async ({
  page,
  browser,
}) => {
  await login(page, "reviewer");
  const id = await create(page, "restricciones");
  const endpoint = `/api/privado/registros/${id}/ajustes`;
  const data = {
    note: "Observación ficticia suficientemente concreta para corregir el relato.",
    confirmed: true,
    version: 1,
  };
  for (const bad of [
    { ...data, note: "   " },
    { ...data, note: "x".repeat(2001) },
    { ...data, confirmed: false },
    { ...data, requested_by: "forged" },
  ])
    expect(
      (
        await page.request.post(endpoint, { headers: { origin }, data: bad })
      ).status(),
    ).toBe(400);
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin },
        data: { ...data, version: 99 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin: "https://foreign.test" },
        data,
      })
    ).status(),
  ).toBe(403);
  const draft = await create(page, "borrador", false);
  expect(
    (
      await page.request.post(`/api/privado/registros/${draft}/ajustes`, {
        headers: { origin },
        data,
      })
    ).status(),
  ).toBe(409);
  const validated = await create(page, "validado");
  expect(
    (
      await page.request.post(
        `/api/privado/registros/${validated}/validacion`,
        { headers: { origin }, data: { confirmed: true, version: 1 } },
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post(`/api/privado/registros/${validated}/ajustes`, {
        headers: { origin },
        data: { ...data, version: 2 },
      })
    ).status(),
  ).toBe(409);
  const submissionKey = crypto.randomUUID();
  const publicTitle = `Reporte recibido · ${submissionKey.slice(0, 8)}`;
  const token = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description:
            "Relato ficticio sin cuenta que no dispone de canal para solicitar ajustes.",
          consent: "true", consentVersion: AI_CONSENT_VERSION,

          website: "",
          token: token.token,
          submissionKey,
          evidence: await imageFixture(),
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/equipo");
  await page.getByRole("heading", { name: publicTitle }).click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]+$/);
  const anonymousId = new URL(page.url()).pathname.split("/").at(-1)!;
  expect((await get(page, anonymousId)).author_id).toBeNull();
  expect(
    (
      await page.request.post(`/api/privado/registros/${anonymousId}/ajustes`, {
        headers: { origin },
        data,
      })
    ).status(),
  ).toBe(409);
  await expect(
    page.getByRole("heading", { name: "Solicitar ajustes" }),
  ).toHaveCount(0);
  const outsiderContext = await browser.newContext();
  const outsider = await outsiderContext.newPage();
  expect(
    (
      await outsider.request.post(endpoint, { headers: { origin }, data })
    ).status(),
  ).toBe(401);
  await login(outsider, "participant");
  expect(
    (
      await outsider.request.post(endpoint, { headers: { origin }, data })
    ).status(),
  ).toBe(403);
  await outsiderContext.close();
  const results = await Promise.all([
    page.request.post(endpoint, { headers: { origin }, data }),
    page.request.post(endpoint, { headers: { origin }, data }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  const history = await (await page.request.get(endpoint)).json();
  expect(history).toHaveLength(1);
  expect(history[0].note).toBe(data.note);
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin },
        data: { ...data, version: 2 },
      })
    ).status(),
  ).toBe(409);
});
test(
  "adjustments supersede old AI output and discard in-flight suggestions",
  { tag: "@simulation" },
  async ({ page }) => {
    test.skip(
      process.env.TEST_AI !== "true",
      "Uses only the isolated simulated provider.",
    );
    await login(page, "reviewer");
    const id = await create(page, "sugerencia");
    const aiEndpoint = `/api/privado/registros/${id}/analisis`;
    const data = {
      text: "Un relato ficticio suficientemente amplio para una sugerencia de prueba.",
      privacyConfirmed: true,

      version: 1,
    };
    expect(
      (
        await page.request.post(aiEndpoint, { headers: { origin }, data })
      ).status(),
    ).toBe(201);
    expect(
      (
        await page.request.post(`/api/privado/registros/${id}/ajustes`, {
          headers: { origin },
          data: {
            note: "Precisa el contexto ficticio antes de revisar nuevamente el registro.",
            confirmed: true,
            version: 1,
          },
        })
      ).status(),
    ).toBe(200);
    let analyses = await (await page.request.get(aiEndpoint)).json();
    expect(analyses[0].superseded_at).toBeTruthy();
    expect(analyses[0].result).toBeTruthy();
    expect(
      (
        await page.request.patch(`/api/privado/registros/${id}`, {
          headers: { origin },
          data: {
            title: "Relato ficticio corregido para una nueva revisión",
            description:
              "Contenido ficticio corregido que cambia el contexto del relato original.",
            submit: true,
            version: 2,
          },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.post(`/api/privado/registros/${id}/validacion`, {
          headers: { origin },
          data: { confirmed: true, version: 3 },
        })
      ).status(),
    ).toBe(200);
    await page.goto(`/equipo/${id}`);
    await expect(
      page.getByText(/anterior a los ajustes; no vigente/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Usar resumen como borrador público" }),
    ).toHaveCount(0);
    const runningId = await create(page, "en-curso");
    const pending = page.request.post(
      `/api/privado/registros/${runningId}/analisis`,
      {
        headers: { origin },
        data: {
          ...data,
          text: "Un relato ficticio para simular espera mientras se solicita corrección.",
        },
      },
    );
    await expect
      .poll(async () => {
        analyses = await (
          await page.request.get(`/api/privado/registros/${runningId}/analisis`)
        ).json();
        return analyses[0]?.status;
      })
      .toBe("running");
    expect(
      (
        await page.request.post(`/api/privado/registros/${runningId}/ajustes`, {
          headers: { origin },
          data: {
            note: "Aclara el contexto ficticio mientras se detiene la sugerencia anterior.",
            confirmed: true,
            version: 1,
          },
        })
      ).status(),
    ).toBe(200);
    expect((await pending).status()).toBe(409);
    analyses = await (
      await page.request.get(`/api/privado/registros/${runningId}/analisis`)
    ).json();
    expect(analyses[0].result).toBeNull();
    expect(analyses[0].error_code).toBe("stale");
    expect(analyses[0].superseded_at).toBeTruthy();
  },
);
