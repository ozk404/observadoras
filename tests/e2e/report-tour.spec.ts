import { test, expect } from "@playwright/test";
import { imageFixture } from "../image-fixture";

test("tutorial is optional, keyboard accessible and preserves the report", async ({
  page,
}) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/denuncias"
    )
      submissions++;
  });
  await page.goto("/reportar");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const description =
    "Registro ficticio para comprobar que el tutorial conserva la información escrita.";
  await page.getByLabel("Descripción de lo ocurrido").fill(description);
  await page
    .getByLabel("URL de la publicación o fuente")
    .fill("https://example.test/tutorial");
  await page.getByLabel("Captura o imagen").setInputFiles(await imageFixture());
  await page.getByRole("checkbox").check();
  const launch = page.getByRole("button", { name: "Ver cómo reportar" });
  await launch.click();
  const dialog = page.getByRole("dialog", { name: "Adjunta la captura" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("form")).toHaveJSProperty("inert", true);
  await expect(dialog.getByRole("button", { name: "Siguiente" })).toBeFocused();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("form")).toHaveJSProperty("inert", false);
  await expect(launch).toBeFocused();
  await expect(page.getByLabel("Descripción de lo ocurrido")).toHaveValue(
    description,
  );
  await expect(page.getByLabel("URL de la publicación o fuente")).toHaveValue(
    "https://example.test/tutorial",
  );
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(
    page.getByRole("img", {
      name: "Vista previa de la imagen que vas a enviar",
    }),
  ).toBeVisible();
  expect(submissions).toBe(0);
  await launch.click();
  await page.getByRole("button", { name: "Cerrar tutorial" }).click();
  await expect(launch).toBeFocused();
  await expect(page.locator("form")).toHaveJSProperty("inert", false);
  for (let index = 0; index < 3; index++) {
    await launch.click();
    await page.getByRole("button", { name: "Cerrar tutorial" }).click();
    await expect(page.locator("form")).toHaveJSProperty("inert", false);
    await expect(launch).toBeFocused();
  }
});

test("all five visual steps fit small and large screens without submitting", async ({
  page,
}) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/denuncias"
    )
      submissions++;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/reportar");
  const titles = [
    "Adjunta la captura",
    "El enlace es opcional",
    "Cuenta qué ocurrió",
    "Revisa la autorización",
    "Envía a revisión",
  ];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.getByRole("button", { name: "Ver cómo reportar" }).click();
    await expect(page.locator("body")).toHaveClass(/driver-simple/);
    for (let index = 0; index < titles.length; index++) {
      const dialog = page.getByRole("dialog", { name: titles[index] });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(`${index + 1} de 5`, { exact: true }),
      ).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        width < 600 ? 844 : 1000,
      );
      if (index === 1) {
        await dialog.getByRole("button", { name: "Anterior" }).click();
        await expect(
          page.getByRole("dialog", { name: titles[0] }),
        ).toBeVisible();
        await page.keyboard.press("ArrowRight");
        await expect(dialog).toBeVisible();
      }
      if ([390, 1440].includes(width) && [0, 3].includes(index))
        await page.screenshot({
          path: `artifacts/report-tour-${width}-${index + 1}.png`,
        });
      await dialog
        .getByRole("button", { name: index === 4 ? "Terminar" : "Siguiente" })
        .click();
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Ver cómo reportar" }),
    ).toBeFocused();
    await expect(page.locator(".driver-overlay")).toHaveCount(0);
  }
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByLabel("Descripción de lo ocurrido")).toHaveValue("");
  expect(submissions).toBe(0);
});

test("leaving the route removes the tutorial overlay and restores the page", async ({
  page,
}) => {
  await page.goto("/reportar");
  await page.getByRole("button", { name: "Ver cómo reportar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator(".wordmark")
    .evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL("/");
  await expect(
    page.locator(".driver-overlay, .report-tour-popover"),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/driver-active/);
  await page.getByRole("link", { name: "Enviar reporte", exact: true }).click();
  await page.getByRole("button", { name: "Ver cómo reportar" }).click();
  await expect(
    page.getByRole("dialog", { name: "Adjunta la captura" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
