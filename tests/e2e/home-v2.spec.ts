import { test, expect } from "./fixtures";
test("Inicio ADN: responsive structure, factual copy, primary purple blocks and accessible controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Observatorio de Violencia Política",
  );
  const content = await page.locator("body").innerText();
  expect(content).not.toMatch(
    /mujeres cuenta|merece un espacio|Tu voz|Conocer también|Imagen por producir|Ilustración principal|Documentar\. Revisar\. Visibilizar|Envío privado|Publicación tras aprobación|Original privado|riesgo|patrones/i,
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  const program = page.getByRole("region", { name: "¿Qué es el Programa Paridad 2026?" });
  await expect(program).toContainText("mujeres jóvenes y juventudes diversas");
  const territory = program.getByRole("complementary", {
    name: "Alcance territorial del programa",
  });
  await expect(territory.getByRole("listitem")).toHaveText([
    "Guatemala",
    "Quiché",
    "Quetzaltenango",
    "Sololá",
  ]);
  await expect(page.locator("main ol")).toHaveCount(0);
  const scope = page.getByRole("region", { name: "Ámbitos de observación" });
  for (const name of [
    "Violencia política digital",
    "Desinformación",
    "Barreras a la participación",
  ])
    await expect(
      scope.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  const purpose = page.getByRole("region", {
    name: "Objetivo del observatorio",
  });
  await expect(purpose).toContainText("espacios de decisión");
  const catalog = page.getByRole("region", { name: "Reportes publicados" });
  const contrast = await purpose.evaluate((el) => {
    const background = getComputedStyle(el).backgroundColor;
    const foreground = getComputedStyle(el.querySelector("p")!).color;
    function luminance(color: string) {
      const rgb = color
        .match(/\d+/g)!
        .slice(0, 3)
        .map(Number)
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }
    const a = luminance(background),
      b = luminance(foreground);
    return {
      background,
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    };
  });
  expect(contrast.background).toBe("rgb(105, 8, 139)");
  expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
  expect(
    await catalog.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(105, 8, 139)");
  const inverse = catalog.getByRole("link", { name: "Ver el catálogo" });
  await inverse.focus();
  expect(
    await inverse.evaluate((el) => getComputedStyle(el).outlineColor),
  ).toBe("rgb(255, 255, 255)");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const primary = page.getByRole("link", {
      name: "Enviar un reporte",
      exact: true,
    }).first();
    expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: `artifacts/home-v2-${width}.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  expect(
    await page.evaluate(() => document.fonts.check('820 50px "Archivo Home"')),
  ).toBe(true);
});
test("Inicio ADN: links lead to real routes and its visual scope does not leak to adjacent pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/reportar");
  const baseline = await page
    .locator(".header-inner")
    .evaluate((el) => getComputedStyle(el).minHeight);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Enviar un reporte", exact: true }).first()
    .click();
  await expect(page).toHaveURL(/\/reportar$/);
  await expect(
    page.getByRole("heading", { name: "Enviar un reporte" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".header-inner")
      .evaluate((el) => getComputedStyle(el).minHeight),
  ).toBe(baseline);
  await expect(
    page.getByRole("checkbox", { name: /Autorizo el análisis/ }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("link", { name: "Explorar reportes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/reportes$/);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Ver el catálogo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/reportes$/);
  await page.goto("/");
  await page
    .getByRole("link", {
      name: "Privacidad y cuidado de la información",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(
    page.getByRole("heading", { name: "Análisis con inteligencia artificial" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: /Acceso del equipo/ }).click();
  await expect(page).toHaveURL(/\/ingreso$/);
  expect((await page.request.get("/api/privado/dashboard")).status()).toBe(401);
});
