import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import sharp from "sharp";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(request: APIRequestContext, role = "reviewer") {
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { origin },
        data: {
          username: `${prefix}-${role}`,
          password: process.env.TEST_PASSWORD,
        },
      })
    ).status(),
  ).toBe(200);
}
async function received(page: Page) {
  const key = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description:
            "Reporte completamente ficticio para verificar la separación entre captura original y copia pública preparada.",
          sourceUrl: "",
          consent: "true",
          consentVersion: AI_CONSENT_VERSION,
          website: "",
          token,
          submissionKey: key,
          evidence: await imageFixture(),
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/equipo");
  await page
    .getByRole("heading", {
      name: `Reporte recibido · ${key.slice(0, 8)}`,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]{36}$/);
  return new URL(page.url()).pathname.split("/").at(-1)!;
}
async function copy(width = 700, height = 1200) {
  return {
    name: "copia-publica-ficticia.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width, height, channels: 3, background: "#69088b" },
    })
      .withMetadata({
        exif: { IFD0: { Artist: "Metadato ficticio que debe retirarse" } },
      })
      .png()
      .toBuffer(),
  };
}
const endpoint = (id: string) => `/api/privado/registros/${id}/imagen-publica`;
async function context(request: APIRequestContext, id: string) {
  const response = await request.get(endpoint(id));
  expect(response.status()).toBe(200);
  return response.json();
}
async function validate(request: APIRequestContext, id: string) {
  expect(
    (
      await request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { version: 1, confirmed: true },
      })
    ).status(),
  ).toBe(200);
}
const textData = {
  title: `Publicación ficticia con imagen ${prefix}`,
  body: "Texto público ficticio revisado por una persona, separado del original privado.",
  privacyConfirmed: true,
  publicationConfirmed: true,
  version: 2,
};
test.beforeEach(() =>
  test.skip(!process.env.TEST_PASSWORD, "Isolated core fixtures required."),
);

test("reviewer explicitly publishes a prepared image atomically; public views never serve the original", async ({
  page,
  browser,
}) => {
  await login(page.request);
  const id = await received(page);
  const source = `/api/privado/registros/${id}/evidencia`;
  const original = await (await page.request.get(source)).body();
  await validate(page.request, id);
  const file = await copy();
  const invalid = await page.request.post(
    `/api/privado/registros/${id}/publicacion`,
    {
      headers: { origin },
      multipart: {
        ...Object.fromEntries(
          Object.entries(textData).map(([key, value]) => [key, String(value)]),
        ),
        image: file,
        imageDescription: "Copia ficticia sin datos personales",
        imageConfirmed: "false",
      },
    },
  );
  expect(invalid.status()).toBe(400);
  expect(await context(page.request, id)).toBeNull();
  expect(
    (await (await page.request.get(`/api/privado/registros/${id}`)).json())
      .status,
  ).toBe("validated");
  await page.reload();
  await page.getByLabel("Título público", { exact: true }).fill(textData.title);
  await page
    .getByLabel("Versión pública revisada", { exact: true })
    .fill(textData.body);
  await page
    .getByLabel("Subir otra imagen", { exact: true })
    .setInputFiles(file);
  await page
    .getByLabel("Descripción de la imagen pública", { exact: true })
    .fill("Captura ficticia preparada sin datos personales");
  await page
    .getByRole("checkbox", { name: /Revisé los datos visibles/ })
    .check();
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  const publication = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/privado/registros/${id}/publicacion`) &&
      response.request().method() === "POST",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Aprobar y publicar esta versión",
      exact: true,
    })
    .click();
  const response = await publication;
  expect(response.status()).toBe(201);
  const publicationId = (await response.json()).id;
  await expect(
    page.getByText("Versión pública aprobada", { exact: true }),
  ).toBeVisible();
  const approved = await context(page.request, id);
  expect(approved.image_version).toBe(1);
  expect(approved.asset_id).not.toBe(id);
  expect(approved.asset_id).not.toBe(publicationId);
  const visitor = await browser.newContext();
  expect((await visitor.request.get(source)).status()).toBe(401);
  for (const wrong of [id, publicationId])
    expect(
      (await visitor.request.get(`/api/imagenes-publicas/${wrong}`)).status(),
    ).toBe(404);
  const asset = await visitor.request.get(
    `/api/imagenes-publicas/${approved.asset_id}`,
  );
  expect(asset.status()).toBe(200);
  expect(asset.headers()["cache-control"]).toBe("no-store");
  expect(asset.headers()["x-content-type-options"]).toBe("nosniff");
  const metadata = await sharp(await asset.body()).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(700);
  expect(metadata.height).toBe(1200);
  expect(metadata.exif).toBeUndefined();
  const thumb = await visitor.request.get(
    `/api/imagenes-publicas/${approved.asset_id}?vista=miniatura`,
  );
  expect(thumb.status()).toBe(200);
  const small = await sharp(await thumb.body()).metadata();
  expect(small.width).toBeLessThanOrEqual(256);
  expect(small.height).toBeLessThanOrEqual(192);
  expect((await (await page.request.get(source)).body()).equals(original)).toBe(
    true,
  );
  const publicPage = await visitor.newPage();
  await publicPage.goto("/reportes");
  const card = publicPage.getByRole("article").filter({
    has: publicPage.getByRole("heading", {
      name: textData.title,
      exact: true,
    }),
  });
  await expect(card.getByRole("img")).toBeVisible();
  await expect(card.getByRole("img")).toHaveCSS("object-fit", "contain");
  await publicPage.goto(`/reportes/${publicationId}`);
  await expect(
    publicPage.getByRole("img", { name: approved.description, exact: true }),
  ).toBeVisible();
  await publicPage
    .getByRole("button", { name: "Ampliar imagen pública" })
    .click();
  const modal = publicPage.getByRole("dialog", {
    name: "Imagen pública",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Tamaño real" }).click();
  await expect(
    modal.getByRole("button", { name: "Ajustar a pantalla" }),
  ).toHaveAttribute("aria-pressed", "true");
  await publicPage.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  for (const width of [1440, 390, 320]) {
    await publicPage.setViewportSize({ width, height: 1000 });
    expect(
      await publicPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await publicPage.screenshot({
      path: `artifacts/publicacion-imagen-${width}.png`,
      fullPage: true,
    });
  }
  await publicPage.route(
    `**/api/imagenes-publicas/${approved.asset_id}`,
    (route) => route.fulfill({ status: 503, body: "" }),
  );
  await publicPage.reload();
  await expect(
    publicPage.getByText("La imagen pública no está disponible.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(publicPage.locator('img[src*="/api/privado/"]')).toHaveCount(0);
  expect(
    await publicPage.evaluate(() => document.documentElement.style.overflow),
  ).toBe("");
  await publicPage.unroute(`**/api/imagenes-publicas/${approved.asset_id}`);
  // Existing publication: replace deliberately, then withdraw; old URLs stop serving it.
  await page.reload();
  const panel = page.getByRole("region", {
    name: "Imagen pública",
    exact: true,
  });
  await expect(panel.getByLabel("Subir otra imagen")).toBeEnabled();
  await panel
    .getByLabel("Subir otra imagen")
    .setInputFiles(await copy(1200, 400));
  await panel
    .getByLabel("Descripción de la imagen pública")
    .fill("Segunda copia ficticia preparada y revisada");
  await panel
    .getByRole("checkbox", { name: /Revisé los datos visibles/ })
    .check();
  page.once("dialog", (dialog) => dialog.accept());
  await panel
    .getByRole("button", { name: "Reemplazar imagen pública" })
    .click();
  await expect
    .poll(async () => (await context(page.request, id)).image_version)
    .toBe(2);
  const replaced = await context(page.request, id);
  expect(replaced.asset_id).not.toBe(approved.asset_id);
  expect(
    (
      await visitor.request.get(`/api/imagenes-publicas/${approved.asset_id}`)
    ).status(),
  ).toBe(404);
  await expect(
    panel.getByRole("img", { name: replaced.description, exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await panel.getByRole("button", { name: "Retirar imagen pública" }).click();
  await expect
    .poll(async () => (await context(page.request, id)).asset_id)
    .toBeNull();
  expect(
    (
      await visitor.request.get(`/api/imagenes-publicas/${replaced.asset_id}`)
    ).status(),
  ).toBe(404);
  expect((await (await page.request.get(source)).body()).equals(original)).toBe(
    true,
  );
  const record = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(record.status).toBe("published");
  expect(record.version).toBe(3);
  await publicPage.reload();
  await expect(
    publicPage.getByRole("button", { name: "Ampliar imagen pública" }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByText(textData.body, { exact: true }),
  ).toBeVisible();
  await visitor.close();
});

test("public copies reject unauthorized, invalid and stale changes; concurrent approvals permit one image", async ({
  page,
  browser,
}) => {
  await login(page.request);
  const id = await received(page);
  const file = await copy(400, 1000);
  const upload = {
    version: "0",
    description: "Copia ficticia revisada sin datos personales",
    confirmed: "true",
    image: file,
  };
  expect(
    (
      await page.request.put(endpoint(id), {
        headers: { origin },
        multipart: upload,
      })
    ).status(),
  ).toBe(409);
  await validate(page.request, id);
  const published = await page.request.post(
    `/api/privado/registros/${id}/publicacion`,
    { headers: { origin }, data: textData },
  );
  expect(published.status()).toBe(201);
  const pubId = (await published.json()).id;
  const visitor = await browser.newContext();
  expect((await visitor.request.get(endpoint(id))).status()).toBe(401);
  expect(
    (await visitor.request.get(`/api/imagenes-publicas/${pubId}`)).status(),
  ).toBe(404);
  const other = await browser.newContext();
  await login(other.request, "participant");
  expect((await other.request.get(endpoint(id))).status()).toBe(403);
  expect(
    (
      await other.request.put(endpoint(id), {
        headers: { origin },
        multipart: upload,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await other.request.delete(endpoint(id), {
        headers: { origin },
        data: { version: 0, confirmed: true },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await page.request.put(endpoint(id), { multipart: upload })).status(),
  ).toBe(403);
  for (const multipart of [
    { ...upload, confirmed: "false" },
    { ...upload, version: "" },
    { ...upload, originalEvidenceId: id },
    {
      ...upload,
      image: {
        name: "bad.png",
        mimeType: "image/png",
        buffer: Buffer.from("invalid image"),
      },
    },
  ])
    expect(
      (
        await page.request.put(endpoint(id), { headers: { origin }, multipart })
      ).status(),
    ).toBe(400);
  const attempts = await Promise.all([
    page.request.put(endpoint(id), { headers: { origin }, multipart: upload }),
    page.request.put(endpoint(id), { headers: { origin }, multipart: upload }),
  ]);
  expect(attempts.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  const current = await context(page.request, id);
  expect(current.image_version).toBe(1);
  expect(
    (
      await page.request.delete(endpoint(id), {
        headers: { origin },
        data: { version: 0, confirmed: true },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(endpoint(id), {
        headers: { origin },
        data: { version: 1, confirmed: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.put(endpoint(id), {
        headers: { origin },
        multipart: {
          ...upload,
          version: "1",
          image: { ...file, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) },
        },
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await page.request.delete(endpoint(id), {
        headers: { origin },
        data: { version: 1, confirmed: true },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await visitor.request.get(`/api/imagenes-publicas/${current.asset_id}`)
    ).status(),
  ).toBe(404);
  await other.close();
  await visitor.close();
});

test("reviewer includes stored original with explicit approval and no reupload", async ({
  page,
  browser,
}) => {
  await login(page.request);
  const id = await received(page);
  const source = `/api/privado/registros/${id}/evidencia`;
  const original = await (await page.request.get(source)).body();
  await validate(page.request, id);
  const fields = {
    ...Object.fromEntries(
      Object.entries(textData).map(([key, value]) => [key, String(value)]),
    ),
    imageSource: "original",
    imageDescription: "Captura ficticia revisada",
    imageConfirmed: "false",
  };
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        multipart: fields,
      })
    ).status(),
  ).toBe(400);
  expect(await context(page.request, id)).toBeNull();
  const participant = await browser.newContext();
  await login(participant.request, "participant");
  expect(
    (
      await participant.request.post(
        `/api/privado/registros/${id}/publicacion`,
        {
          headers: { origin },
          multipart: { ...fields, imageConfirmed: "true" },
        },
      )
    ).status(),
  ).toBe(403);
  await participant.close();
  await page.reload();
  await page
    .getByLabel("Título público", { exact: true })
    .fill(textData.title + " original");
  await page
    .getByLabel("Versión pública revisada", { exact: true })
    .fill(textData.body);
  const publicFields = {
    "Resumen público":
      "Síntesis ficticia aprobada sobre obstáculos a la participación política.",
    "Contexto público":
      "Contexto ficticio preparado para publicación; no procede de notas privadas.",
    "Hallazgos públicos":
      "Hallazgo ficticio revisado: el mensaje busca desacreditar la participación.",
    "Análisis público del observatorio":
      "Análisis ficticio orientativo, revisado por una persona antes de difundirse.",
  };
  for (const [label, value] of Object.entries(publicFields))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByLabel(/^Límites del análisis público/)
    .fill("No se ha verificado la autenticidad del ejemplo ficticio.");
  await page
    .locator('input[name="public-categories"][value="desinformacion"]')
    .check();
  await page
    .getByRole("checkbox", { name: "Incluir captura original" })
    .check();
  const preview = page.getByAltText("Vista previa de la imagen pública");
  await expect(preview).toHaveAttribute("src", source);
  await expect(preview).toBeVisible();
  await page
    .getByLabel("Descripción de la imagen pública", { exact: true })
    .fill("Captura ficticia revisada");
  await page
    .getByRole("checkbox", { name: /Revisé los datos visibles/ })
    .check();
  await page.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await page.getByRole("checkbox", { name: /Apruebo explícitamente/ }).check();
  await page.screenshot({
    path: "artifacts/public-original-picker.png",
    fullPage: true,
  });
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/privado/registros/${id}/publicacion`) &&
      r.request().method() === "POST",
  );
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Aprobar y publicar esta versión",
      exact: true,
    })
    .click();
  const publishedResponse = await response;
  expect(publishedResponse.status()).toBe(201);
  const publicId = (await publishedResponse.json()).id;
  const approved = await context(page.request, id);
  expect(approved.image_version).toBe(1);
  const visitor = await browser.newContext();
  expect(
    await (
      await visitor.request.get(`/api/imagenes-publicas/${approved.asset_id}`)
    ).body(),
  ).toEqual(original);
  expect((await visitor.request.get(source)).status()).toBe(401);
  const publicPage = await visitor.newPage();
  await publicPage.goto(`/reportes/${publicId}`);
  for (const value of Object.values(publicFields))
    await expect(publicPage.getByText(value, { exact: true })).toBeVisible();
  await expect(
    publicPage.getByRole("list", { name: "Categorías aprobadas" }),
  ).toContainText("Desinformación");
  await expect(
    publicPage.getByText(
      "Reporte completamente ficticio para verificar la separación entre captura original y copia pública preparada.",
      { exact: true },
    ),
  ).toHaveCount(0);
  for (const width of [1440, 768, 390, 320]) {
    await publicPage.setViewportSize({ width, height: 1000 });
    expect(
      await publicPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await publicPage.screenshot({
      path: `artifacts/publication-rich-${width}.png`,
      fullPage: true,
    });
  }
  await publicPage
    .getByRole("button", { name: "Ampliar imagen pública" })
    .click();
  await expect(
    publicPage.getByRole("dialog", { name: "Imagen pública", exact: true }),
  ).toBeVisible();
  await publicPage.keyboard.press("Escape");

  expect(await (await page.request.get(source)).body()).toEqual(original);
  expect(
    (
      await page.request.put(endpoint(id), {
        headers: { origin },
        multipart: {
          version: "1",
          imageSource: "original",
          description: "Otra aprobación ficticia",
          confirmed: "true",
        },
      })
    ).status(),
  ).toBe(200);
  const replaced = await context(page.request, id);
  expect(replaced.image_version).toBe(2);
  expect(replaced.asset_id).not.toBe(approved.asset_id);
  expect(
    (
      await visitor.request.get(`/api/imagenes-publicas/${approved.asset_id}`)
    ).status(),
  ).toBe(404);
  expect(await (await page.request.get(source)).body()).toEqual(original);
  await visitor.close();
});

test("published image approval finishes independently of a delayed page refresh", async ({
  page,
}) => {
  await login(page.request);
  const id = await received(page);
  await validate(page.request, id);
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/publicacion`, {
        headers: { origin },
        data: textData,
      })
    ).status(),
  ).toBe(201);
  await page.reload();
  const panel = page.getByRole("region", {
    name: "Imagen pública",
    exact: true,
  });
  await panel
    .getByRole("checkbox", { name: "Incluir captura original" })
    .check();
  await panel
    .getByLabel("Descripción de la imagen pública", { exact: true })
    .fill("Captura ficticia para probar guardado sin bloqueo.");
  await panel
    .getByRole("checkbox", { name: /Revisé los datos visibles/ })
    .check();
  let release: () => void = () => {};
  const blocked = new Promise<void>((r) => (release = r));
  await page.route("**/equipo/**", async (route) => {
    if (route.request().headers()["rsc"] === "1") await blocked;
    await route.continue();
  });
  try {
    const saved = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/privado/registros/${id}/imagen-publica`) &&
        r.request().method() === "PUT",
    );
    page.once("dialog", (d) => d.accept());
    await panel
      .getByRole("button", { name: "Aprobar imagen pública", exact: true })
      .click();
    const savedResponse = await saved;
    expect(savedResponse.status()).toBe(200);
    const savedImage = await savedResponse.json();
    await expect(
      panel.getByRole("button", { name: "Guardando…", exact: true }),
    ).toHaveCount(0, { timeout: 5000 });
    await expect(
      panel.getByRole("button", {
        name: "Retirar imagen pública",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(
      panel.locator(`img[src="/api/imagenes-publicas/${savedImage.assetId}"]`),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await panel
      .getByRole("button", { name: "Retirar imagen pública", exact: true })
      .click();
    await expect(
      panel.getByText("Esta publicación todavía no tiene una imagen pública."),
    ).toBeVisible();
    expect(
      (
        await page.request.get(`/api/imagenes-publicas/${savedImage.assetId}`)
      ).status(),
    ).toBe(404);
    // A failed save must release the button and preserve the selected image.
    await page.route(
      `**/api/privado/registros/${id}/imagen-publica`,
      async (route) => {
        if (route.request().method() === "PUT")
          await route.fulfill({
            status: 503,
            json: { error: "Fallo ficticio del servicio." },
          });
        else await route.continue();
      },
    );
    await panel
      .getByRole("checkbox", { name: "Incluir captura original" })
      .check();
    await panel
      .getByLabel("Descripción de la imagen pública", { exact: true })
      .fill("Captura ficticia conservada después del error.");
    await panel
      .getByRole("checkbox", { name: /Revisé los datos visibles/ })
      .check();
    page.once("dialog", (d) => d.accept());
    await panel
      .getByRole("button", { name: "Aprobar imagen pública", exact: true })
      .click();
    await expect(panel.getByRole("alert")).toHaveText(
      "Fallo ficticio del servicio.",
    );
    await expect(
      panel.getByRole("button", {
        name: "Aprobar imagen pública",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(
      panel.getByRole("checkbox", { name: "Incluir captura original" }),
    ).toBeChecked();
  } finally {
    release();
  }
});

test("follow-up and alert draft keep working with delayed refresh and recover from failed writes", async ({
  page,
}) => {
  await login(page.request);
  const id = await received(page);
  await validate(page.request, id);
  await page.reload();
  const follow = page.getByRole("region", { name: "Seguimiento", exact: true });
  const alert = page.getByRole("region", {
    name: "Borrador de alerta",
    exact: true,
  });
  let release: () => void = () => {};
  const blocked = new Promise<void>((r) => (release = r));
  await page.route("**/equipo/**", async (route) => {
    if (route.request().headers()["rsc"] === "1") await blocked;
    await route.continue();
  });
  const saveDraft = async () => {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/privado/registros/${id}/borrador-alerta`) &&
        r.request().method() === "POST",
    );
    await alert
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    const savedResponse = await response;
    if (savedResponse.status() !== 200) {
      const stored = await (
        await page.request.get(`/api/privado/registros/${id}`)
      ).json();
      throw Error(
        `Save status ${savedResponse.status()}; sent reportVersion ${savedResponse.request().postDataJSON().reportVersion}; stored ${stored.version}; ${(await savedResponse.json()).error}`,
      );
    }
    await expect(
      alert.getByLabel("Título de alerta", { exact: true }),
    ).toBeEnabled();
  };
  try {
    const note = "Primera nota ficticia con recarga detenida.";
    await follow.getByLabel("Nota", { exact: true }).fill(note);
    await follow
      .getByRole("button", { name: "Guardar nota", exact: true })
      .click();
    await expect(
      follow.getByRole("article").getByText(note, { exact: true }),
    ).toHaveCount(1);
    await expect(follow.getByLabel("Nota", { exact: true })).toBeEnabled();
    await alert
      .getByLabel("Título de alerta", { exact: true })
      .fill("Alerta ficticia sin bloqueo");
    await alert
      .getByLabel("Texto de alerta", { exact: true })
      .fill("Primer texto ficticio conservado sin esperar la recarga.");
    await saveDraft();
    await follow
      .getByLabel("Nota", { exact: true })
      .fill("Segunda nota ficticia con versión actualizada.");
    await follow
      .getByRole("button", { name: "Guardar nota", exact: true })
      .click();
    await expect(
      follow
        .getByRole("article")
        .getByText("Segunda nota ficticia con versión actualizada.", {
          exact: true,
        }),
    ).toBeVisible();
    const revised =
      "Segundo texto ficticio con borrador y versión del reporte vigentes.";
    await alert.getByLabel("Texto de alerta", { exact: true }).fill(revised);
    await saveDraft();
    const current = await (
      await page.request.get(`/api/privado/registros/${id}/borrador-alerta`)
    ).json();
    expect(current.draft.version).toBe(2);
    const failUrl = `**/api/privado/registros/${id}/borrador-alerta`;
    await page.route(failUrl, (route) =>
      route.fulfill({
        status: 503,
        json: { error: "Fallo ficticio al guardar." },
      }),
    );
    const unsaved =
      "Texto ficticio que debe conservarse después del error de guardado.";
    await alert.getByLabel("Texto de alerta", { exact: true }).fill(unsaved);
    await alert
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await expect(alert.getByRole("alert")).toHaveText(
      "Fallo ficticio al guardar.",
    );
    await expect(
      alert.getByLabel("Texto de alerta", { exact: true }),
    ).toHaveValue(unsaved);
    await expect(
      alert.getByRole("button", { name: "Guardar borrador", exact: true }),
    ).toBeEnabled();
    await page.unroute(failUrl);
    await saveDraft();
    await follow
      .getByRole("button", { name: "Cerrar seguimiento", exact: true })
      .click();
    await follow
      .getByLabel("Motivo del cierre")
      .fill("Cierre ficticio confirmado sin esperar la recarga.");
    page.once("dialog", (d) => d.accept());
    await follow
      .getByRole("button", { name: "Confirmar cierre", exact: true })
      .click();
    await expect(follow.getByText("Cerrado", { exact: true })).toBeVisible();
    await expect(
      follow.getByRole("button", { name: "Guardar nota", exact: true }),
    ).toHaveCount(0);
  } finally {
    release();
  }
});
