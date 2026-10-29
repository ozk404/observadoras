import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect, type Page } from "@playwright/test";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(page: Page, role = "reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-followup-${role}`);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
async function create(page: Page, submit = true) {
  const response = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Seguimiento ficticio ${prefix}`,
      description:
        "Relato enteramente ficticio para probar notas privadas y cierre de seguimiento.",
      submit,
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
const endpoint = (id: string) => `/api/privado/registros/${id}/seguimiento`;
async function createPublic(page: Page) {
  const submissionKey = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description:
            "Relato ficticio sin cuenta para comprobar seguimiento privado y cierre sin retirar la publicación.",
          consent: "true", consentVersion: AI_CONSENT_VERSION,

          website: "",
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
  expect(
    (await (await page.request.get(`/api/privado/registros/${id}`)).json())
      .author_id,
  ).toBeNull();
  return id;
}
test("reviewer adds notes and closes follow-up while the approved publication stays visible", async ({
  page,
  browser,
}) => {
  await login(page);
  const id = await createPublic(page);
  await validate(page, id);
  const published = await page.request.post(
    `/api/privado/registros/${id}/publicacion`,
    {
      headers: { origin },
      data: {
        version: 2,
        title: `Publicación conservada ${prefix}`,
        body: "Versión pública ficticia que conserva únicamente información aprobada.",
        privacyConfirmed: true,
        publicationConfirmed: true,
      },
    },
  );
  expect(published.status()).toBe(201);
  await page.goto(`/equipo/${id}`);
  const panel = page.getByRole("region", { name: "Seguimiento" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await panel.getByLabel("Nota", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    panel.getByRole("button", { name: "Guardar nota" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 900 });
  await panel
    .getByLabel("Nota", { exact: true })
    .fill("Primera nota privada ficticia del equipo revisor.");
  await panel.getByRole("button", { name: "Guardar nota" }).click();
  await expect(
    panel
      .getByRole("article")
      .getByText("Primera nota privada ficticia del equipo revisor.", {
        exact: true,
      }),
  ).toBeVisible();
  await page.reload();
  await panel
    .getByLabel("Nota", { exact: true })
    .fill("Segunda nota privada ficticia para comprobar el historial.");
  await panel.getByRole("button", { name: "Guardar nota" }).click();
  await expect(
    panel
      .getByRole("article")
      .getByText("Segunda nota privada ficticia para comprobar el historial.", {
        exact: true,
      }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Cerrar seguimiento", exact: true })
    .click();
  await panel
    .getByLabel("Motivo del cierre")
    .fill(
      "Cierre ficticio del seguimiento tras completar la revisión del equipo.",
    );
  page.once("dialog", (dialog) => dialog.accept());
  await panel.getByRole("button", { name: "Confirmar cierre" }).click();
  await expect(panel.getByText("Cerrado", { exact: true })).toBeVisible();
  await page.reload();
  await expect(panel.getByRole("textbox")).toHaveCount(0);
  const history = await (await page.request.get(endpoint(id))).json();
  expect(history.map((entry: { kind: string }) => entry.kind)).toEqual([
    "note",
    "note",
    "closed",
  ]);
  expect(
    history.every(
      (entry: { reviewer_username: string; created_at: string }) =>
        entry.reviewer_username === `${prefix}-followup-reviewer` &&
        entry.created_at,
    ),
  ).toBe(true);
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.status).toBe("published");
  expect(record.version).toBe(6);
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto(`${origin}/reportes`);
  await publicPage
    .getByRole("heading", { name: `Publicación conservada ${prefix}` })
    .click();
  await expect(publicPage).toHaveURL(/\/reportes\/[a-f0-9-]{36}$/);
  await expect(
    publicPage.getByText(
      "Versión pública ficticia que conserva únicamente información aprobada.",
    ),
  ).toBeVisible();
  expect(await publicPage.locator("body").innerText()).not.toContain(
    "nota privada ficticia",
  );
  expect((await visitor.request.get(`${origin}${endpoint(id)}`)).status()).toBe(
    401,
  );
  await visitor.close();
  expect(
    (
      await page.request.post(endpoint(id), {
        headers: { origin },
        data: {
          action: "note",
          note: "Nueva nota que debe rechazarse después del cierre.",
          version: record.version,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.post(endpoint(id), {
        headers: { origin },
        data: {
          action: "close",
          note: "Otro cierre ficticio que no debe duplicarse.",
          confirmed: true,
          version: record.version,
        },
      })
    ).status(),
  ).toBe(409);
  await page.screenshot({
    path: "artifacts/followup-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/followup-mobile.png",
    fullPage: true,
  });
});
test("follow-up denies participants, unsupported states, forged data, foreign origins and stale versions", async ({
  page,
  browser,
}) => {
  await login(page, "participant");
  const id = await create(page);
  const draftId = await create(page, false);
  expect((await page.request.get(endpoint(id))).status()).toBe(403);
  expect(
    (
      await page.request.post(endpoint(id), {
        headers: { origin },
        data: {
          action: "note",
          note: "Nota privada ficticia sin permisos de revisión.",
          version: 1,
        },
      })
    ).status(),
  ).toBe(403);
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  await login(reviewer);
  const post = (recordId: string, data: unknown, requestOrigin = origin) =>
    reviewer.request.post(`${origin}${endpoint(recordId)}`, {
      headers: { origin: requestOrigin },
      data,
    });
  expect(
    (
      await post(id, {
        action: "note",
        note: "Nota que aún no se permite en estado pendiente.",
        version: 1,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await post(draftId, {
        action: "note",
        note: "Nota que no debe acceder a un borrador ajeno.",
        version: 1,
      })
    ).status(),
  ).toBe(404);
  await validate(reviewer, id);
  expect(
    (
      await post(id, {
        action: "close",
        note: "Cierre sin confirmación explícita de la revisora.",
        version: 2,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post(id, {
        action: "note",
        note: "Un texto ficticio con identidad forjada.",
        version: 2,
        reviewer_id: "forged",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post(
        id,
        {
          action: "note",
          note: "Un texto ficticio con origen ajeno rechazado.",
          version: 2,
        },
        "https://foreign.test",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(id, {
        action: "note",
        note: "Un texto ficticio con versión desactualizada.",
        version: 1,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await post(id, {
        action: "note",
        note: "Nota privada invisible para la autora del registro.",
        version: 2,
      })
    ).status(),
  ).toBe(200);
  await page.goto(`/equipo/${id}`);
  await expect(
    page.getByRole("heading", { name: "Seguimiento", exact: true }),
  ).toHaveCount(0);
  expect(await page.locator("body").innerText()).not.toContain(
    "Nota privada invisible",
  );
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(JSON.stringify(record)).not.toContain("Nota privada invisible");
  await reviewerContext.close();
});
test("concurrent closure and publication permit one change; a closed validated record can still be published", async ({
  page,
}) => {
  await login(page);
  const id = await create(page);
  await validate(page, id);
  const publicData = {
    version: 2,
    title: `Publicación después del cierre ${prefix}`,
    body: "Texto ficticio publicado mediante aprobación humana independiente del seguimiento.",
    privacyConfirmed: true,
    publicationConfirmed: true,
  };
  const responses = await Promise.all([
    page.request.post(endpoint(id), {
      headers: { origin },
      data: {
        action: "close",
        note: "Cierre ficticio concurrente con la aprobación de publicación.",
        confirmed: true,
        version: 2,
      },
    }),
    page.request.post(`/api/privado/registros/${id}/publicacion`, {
      headers: { origin },
      data: publicData,
    }),
  ]);
  expect(
    responses.filter((response) => response.status() === 409),
  ).toHaveLength(1);
  expect(
    responses.filter((response) => [200, 201].includes(response.status())),
  ).toHaveLength(1);
  if (responses[0].status() === 200) {
    expect(
      (
        await page.request.post(`/api/privado/registros/${id}/publicacion`, {
          headers: { origin },
          data: { ...publicData, version: 3 },
        })
      ).status(),
    ).toBe(201);
  } else {
    const close = () =>
      page.request.post(endpoint(id), {
        headers: { origin },
        data: {
          action: "close",
          note: "Cierre ficticio duplicado para comprobar una única transición.",
          confirmed: true,
          version: 3,
        },
      });
    const closes = await Promise.all([close(), close()]);
    expect(closes.map((response) => response.status()).sort()).toEqual([
      200, 409,
    ]);
  }
  const history = await (await page.request.get(endpoint(id))).json();
  expect(
    history.filter((entry: { kind: string }) => entry.kind === "closed"),
  ).toHaveLength(1);
  expect(
    (await (await page.request.get(`/api/privado/registros/${id}`)).json())
      .status,
  ).toBe("published");
  const validatedId = await create(page);
  await validate(page, validatedId);
  const closeValidated = () =>
    page.request.post(endpoint(validatedId), {
      headers: { origin },
      data: {
        action: "close",
        note: "Cierre ficticio de registro validado antes de publicar.",
        confirmed: true,
        version: 2,
      },
    });
  const closures = await Promise.all([closeValidated(), closeValidated()]);
  expect(closures.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  expect(
    (
      await page.request.post(
        `/api/privado/registros/${validatedId}/publicacion`,
        {
          headers: { origin },
          data: {
            ...publicData,
            title: `Publicación de validado cerrado ${prefix}`,
            version: 3,
          },
        },
      )
    ).status(),
  ).toBe(201);
  const closedHistory = await (
    await page.request.get(endpoint(validatedId))
  ).json();
  expect(
    closedHistory.filter((entry: { kind: string }) => entry.kind === "closed"),
  ).toHaveLength(1);
});
