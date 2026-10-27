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
    .getByLabel("Seleccionar copia pública", { exact: true })
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
  await expect(panel.getByLabel("Seleccionar copia pública")).toBeEnabled();
  await panel
    .getByLabel("Seleccionar copia pública")
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
