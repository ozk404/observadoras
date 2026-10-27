import { test, expect } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";

test("team tutorial preserves filters, supports direct links, keyboard and empty pages", async ({
  page,
}) => {
  test.skip(!process.env.TEST_PASSWORD, "Requires isolated core fixtures.");
  const auth = await page.request.post("/api/auth/login", {
    headers: { origin },
    data: {
      username: `${prefix}-reviewer`,
      password: process.env.TEST_PASSWORD,
    },
  });
  expect(auth.status()).toBe(200);
  await page.goto("/equipo?estado=pending");
  const launch = page.getByRole("button", {
    name: "Ver tutorial",
    exact: true,
  });
  await expect(page.locator(".driver-popover")).toHaveCount(0);
  await launch.click();
  const popup = page.locator(".team-tour-popover");
  await expect(popup).toBeVisible();
  await expect(page).toHaveURL(/estado=pending#tutorial$/);
  await expect(page.locator("main")).toHaveJSProperty("inert", true);
  await expect(popup.locator(".driver-popover-title")).toHaveText(
    "Filtra por estado",
  );
  const titles: string[] = [];
  for (let i = 0; i < 6; i++) {
    titles.push(await popup.locator(".driver-popover-title").innerText());
    const next = popup.locator(".driver-popover-next-btn");
    if ((await next.innerText()) === "Terminar") {
      await next.click();
      break;
    }
    await next.click();
    await expect(popup.locator(".driver-popover-title")).not.toHaveText(
      titles.at(-1)!,
    );
  }
  expect(titles).toContain("Consulta los reportes");
  expect(titles).toContain("Consulta el resumen");
  await expect(popup).toHaveCount(0);
  await expect(page).toHaveURL(/estado=pending$/);
  await expect(launch).toBeFocused();
  await expect(page.locator("main")).toHaveJSProperty("inert", false);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/equipo?estado=pending&pagina=999#tutorial");
  await expect(popup).toBeVisible();
  await popup.locator(".driver-popover-next-btn").click();
  await expect(popup.locator(".driver-popover-title")).toHaveText(
    "No hay resultados aquí",
  );
  const bounds = await popup.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press("Tab");
  expect(
    await popup.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/equipo-tutorial-320.png" });
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(page).toHaveURL(/estado=pending&pagina=999$/);
  await expect(launch).toBeFocused();
  await launch.click();
  await expect(popup).toBeVisible();
  await page.goto("/reportes");
  await expect(popup).toHaveCount(0);
  await expect(page.locator("main")).toHaveJSProperty("inert", false);
});
