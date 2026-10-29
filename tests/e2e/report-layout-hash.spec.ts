import { test, expect } from "./fixtures";

test("report form uses equal desktop columns and an integrated tutorial header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/reportar");
  const capture = await page.locator(".evidence-upload").boundingBox();
  const details = await page.locator(".report-details").boundingBox();
  const header = await page.locator(".report-form-heading").boundingBox();
  const launch = await page
    .getByRole("button", { name: "Ver cómo reportar" })
    .boundingBox();
  expect(capture!.width).toBeCloseTo(details!.width, 0);
  expect(capture!.y).toBeCloseTo(details!.y, 0);
  expect(details!.x).toBeGreaterThan(capture!.x + capture!.width);
  expect(details!.x + details!.width - capture!.x).toBeGreaterThan(1100);
  expect(launch!.y).toBeGreaterThanOrEqual(header!.y);
  expect(launch!.y + launch!.height).toBeLessThan(header!.y + header!.height);
  await page.screenshot({
    path: "artifacts/reportar-grid-1440.png",
    fullPage: true,
  });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const upper = await page.locator(".evidence-upload").boundingBox();
    const lower = await page.locator(".report-details").boundingBox();
    expect(lower!.y).toBeGreaterThanOrEqual(upper!.y + upper!.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/reportar-grid-${width}.png`,
      fullPage: true,
    });
  }
});

test("direct tutorial fragment opens and closing preserves query without reopening on reload", async ({
  page,
}) => {
  await page.goto("/reportar?origen=guia#tutorial");
  await expect(
    page.getByRole("dialog", { name: "Hola, ¿empezamos?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar tutorial" }).click();
  await expect(page).toHaveURL("/reportar?origen=guia");
  await expect(page.locator("form")).toHaveJSProperty("inert", false);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Ver cómo reportar" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver cómo reportar" }).click();
  await expect(page).toHaveURL("/reportar?origen=guia#tutorial");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/reportar?origen=guia");
});

test("same-page hash opens the tutorial and foreign fragments are preserved", async ({
  page,
}) => {
  await page.goto("/reportar?origen=guia#contexto");
  // Hash changes simulate an action on an already hydrated form.
  await expect(
    page.getByRole("button", { name: "Enviar a revisión" }),
  ).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => {
    location.hash = "tutorial";
  });
  await expect(
    page.getByRole("dialog", { name: "Hola, ¿empezamos?" }),
  ).toBeVisible();
  await page.evaluate(() => {
    location.hash = "contexto";
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/reportar?origen=guia#contexto");
  await expect(page.locator("form")).toHaveJSProperty("inert", false);
  await page.getByRole("button", { name: "Ver cómo reportar" }).click();
  await expect(page).toHaveURL("/reportar?origen=guia#tutorial");
  await page.getByRole("button", { name: "Cerrar tutorial" }).click();
  await expect(page).toHaveURL("/reportar?origen=guia#contexto");
});

test("changing fragment while Driver loads cancels the pending tutorial", async ({
  page,
}) => {
  await page.goto("/reportar");
  // Let hydration finish, then hold only the subsequently requested dynamic JS.
  await expect(
    page.getByRole("button", { name: "Enviar a revisión" }),
  ).toBeEnabled();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const loading = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    requested();
    await held;
    await route.continue();
  });
  await page.evaluate(() => {
    location.hash = "tutorial";
  });
  await loading;
  await page.evaluate(() => {
    location.hash = "contexto";
  });
  release();
  await expect(
    page.getByRole("button", { name: "Ver cómo reportar" }),
  ).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("form")).toHaveJSProperty("inert", false);
  await expect(page).toHaveURL("/reportar#contexto");
  await page.evaluate(() => {
    location.hash = "tutorial";
  });
  await expect(
    page.getByRole("dialog", { name: "Hola, ¿empezamos?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
