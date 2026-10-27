import { test, expect } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
test("comparison panels scroll independently on desktop and return to document flow on mobile", async ({
  page,
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
  const created = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: `Comparación ficticia ${prefix}`,
      description:
        "Descripción ficticia breve para verificar el equilibrio visual.",
      submit: true,
    },
  });
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  const text =
    "Observación completamente ficticia para comprobar el desplazamiento sin datos personales. ";
  await page.route(`**/api/privado/registros/${id}/analisis-inicial`, (route) =>
    route.fulfill({
      json: {
        state: "completed",
        result: {
          assessment: "needs_context",
          assessmentReason: text,
          categories: ["desinformacion"],
          summary: text.repeat(20),
          evidenceNotes: text.repeat(8),
          observations: [text, text, text],
          missingInformation: [text],
          limitations: text,
        },
      },
    }),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/equipo/${id}`);
  const original = page.getByRole("region", {
    name: "Reporte recibido",
    exact: true,
  });
  const ai = page.getByRole("region", {
    name: "Análisis inicial de IA",
    exact: true,
  });
  await expect(ai.getByText(text.repeat(20), { exact: true })).toHaveCount(1);
  const first = await original.boundingBox();
  const second = await ai.boundingBox();
  expect(Math.abs(first!.height - second!.height)).toBeLessThan(2);
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  await ai.evaluate((element) => {
    element.scrollIntoView({ block: "start", behavior: "instant" });
    element.focus({ preventScroll: true });
  });
  const y = await page.evaluate(() => scrollY);
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => ai.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await original.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.screenshot({
    path: "artifacts/ficha-scroll-1440.png",
    fullPage: true,
  });
  // A long original must remain readable without moving the AI panel.
  await original.locator(".report-body").evaluate((element, value) => {
    element.textContent = value;
  }, text.repeat(100));
  await original.evaluate((element) => element.focus({ preventScroll: true }));
  const aiPosition = await ai.evaluate((element) => element.scrollTop);
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => original.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await ai.evaluate((element) => element.scrollTop)).toBe(aiPosition);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(original).toHaveCSS("overflow-y", "visible");
  await expect(ai).toHaveCSS("overflow-y", "visible");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/ficha-scroll-390.png",
    fullPage: true,
  });
});
