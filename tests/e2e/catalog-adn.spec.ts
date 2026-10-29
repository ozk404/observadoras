import { test, expect } from "./fixtures";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
test("public catalog opens approved versions, paginates and fits the ADN without private originals", async ({
  page,
  browser,
}) => {
  test.skip(!process.env.TEST_PASSWORD, "Requires isolated core fixtures.");
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
  const original = `Original completamente ficticio y privado ${prefix}, excluido del catálogo público.`;
  let newest = { id: "", title: "" };
  for (let index = 0; index < 14; index++) {
    const created = await page.request.post("/api/privado/registros", {
      headers: { origin },
      data: {
        title: `Reporte privado ficticio ${prefix} ${index}`,
        description: original,
        submit: true,
      },
    });
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    expect(
      (
        await page.request.post(`/api/privado/registros/${id}/validacion`, {
          headers: { origin },
          data: { confirmed: true, version: 1 },
        })
      ).status(),
    ).toBe(200);
    const title =
      index === 13
        ? `Publicación ficticia ${prefix}: revisión humana de una situación documentada y de su contexto`
        : `Publicación ficticia ${prefix} ${index}`;
    const published = await page.request.post(
      `/api/privado/registros/${id}/publicacion`,
      {
        headers: { origin },
        data: {
          title,
          body: "Versión pública enteramente ficticia, revisada por una persona y separada del contenido recibido. ".repeat(
            (index % 3) + 1,
          ),
          privacyConfirmed: true,
          publicationConfirmed: true,
          version: 2,
        },
      },
    );
    expect(published.status()).toBe(201);
    newest = { id: (await published.json()).id, title };
  }
  const visitor = await browser.newContext();
  const catalog = await visitor.newPage();
  await catalog.goto("/reportes");
  await expect(
    catalog.getByRole("heading", { name: "Reportes revisados", exact: true }),
  ).toBeVisible();
  const region = catalog.getByRole("region", {
    name: "Publicaciones revisadas",
  });
  await expect(region.getByRole("article")).toHaveCount(12);
  expect(await catalog.locator("main").innerText()).not.toContain(original);
  await expect(region.locator("img")).toHaveCount(0);
  for (const width of [1440, 768, 390, 320]) {
    await catalog.setViewportSize({ width, height: 1000 });
    expect(
      await catalog.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await catalog.screenshot({
      path: `artifacts/catalogo-${width}.png`,
      fullPage: true,
    });
  }
  const link = catalog
    .getByRole("heading", { name: newest.title, exact: true })
    .getByRole("link");
  await link.focus();
  await expect(link).toBeFocused();
  await catalog.keyboard.press("Enter");
  await expect(catalog).toHaveURL(`/reportes/${newest.id}`);
  await expect(
    catalog.getByRole("heading", { name: newest.title, exact: true }),
  ).toBeVisible();
  expect(await catalog.locator("main").innerText()).not.toContain(original);
  await expect(catalog.locator("article time")).toHaveAttribute(
    "datetime",
    /T/,
  );
  await expect(catalog.locator("article img")).toHaveCount(0);
  for (const width of [1440, 768, 390, 320]) {
    await catalog.setViewportSize({ width, height: 1000 });
    expect(
      await catalog.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await catalog.screenshot({
      path: `artifacts/publicacion-${width}.png`,
      fullPage: true,
    });
  }
  await catalog
    .getByRole("link", { name: "← Reportes revisados", exact: true })
    .click();
  await expect(catalog).toHaveURL("/reportes");
  await catalog.goto("/reportes");
  await catalog
    .getByRole("navigation", { name: "Paginación de reportes públicos" })
    .getByRole("link", { name: "Siguiente →" })
    .click();
  await expect(catalog).toHaveURL(/pagina=2$/);
  await catalog
    .getByRole("navigation", { name: "Paginación de reportes públicos" })
    .getByRole("link", { name: "← Anterior" })
    .click();
  await expect(catalog).toHaveURL(/pagina=1$/);
  await catalog.goto("/reportes?pagina=9999");
  await expect(
    catalog.getByRole("heading", {
      name: "No hay publicaciones en esta página.",
    }),
  ).toBeVisible();
  await catalog.getByRole("link", { name: /Volver al catálogo/ }).click();
  await expect(catalog).toHaveURL("/reportes");
  await visitor.close();
});
