import { test, expect } from "@playwright/test";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
test("public form requires an image, accepts a private preview and works on mobile", async ({
  page,
}) => {
  await page.goto("/reportar");
  await expect(page.getByLabel("Título breve")).toHaveCount(0);
  await expect(page.getByLabel("Captura o imagen")).toHaveAttribute(
    "required",
    "",
  );
  await expect(
    page.getByLabel("URL de la publicación o fuente"),
  ).not.toHaveAttribute("required");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/reportar-captura-vacia-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/reportar-captura-vacia-mobile.png",
    fullPage: true,
  });
  await page.getByLabel("Captura o imagen").setInputFiles(await imageFixture());
  await expect(
    page.getByRole("img", {
      name: "Vista previa de la imagen que vas a enviar",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quitar imagen" }).click();
  await expect(
    page.getByRole("img", {
      name: "Vista previa de la imagen que vas a enviar",
    }),
  ).toHaveCount(0);
  expect(
    await page
      .getByLabel("Captura o imagen")
      .evaluate((input: HTMLInputElement) => input.files?.length),
  ).toBe(0);
  await expect(page.getByLabel("Captura o imagen")).toBeFocused();
  await page.getByLabel("Captura o imagen").setInputFiles(await imageFixture());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/reportar-evidencia-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/reportar-evidencia-desktop.png",
    fullPage: true,
  });
});
test("capture drop keeps valid files when replacement is invalid or cancelled", async ({
  page,
}) => {
  await page.goto("/reportar");
  const fixture = await imageFixture();
  const zone = page.locator(".capture-surface");
  const transfer = await page.evaluateHandle(
    ({ bytes, name, type }) => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], name, { type }));
      return data;
    },
    {
      bytes: Array.from(fixture.buffer),
      name: fixture.name,
      type: fixture.mimeType,
    },
  );
  await zone.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(zone).toHaveClass(/is-dragging/);
  await zone.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(zone).not.toHaveClass(/is-dragging/);
  await expect(
    page.getByRole("img", {
      name: "Vista previa de la imagen que vas a enviar",
    }),
  ).toBeVisible();
  const input = page.getByLabel("Captura o imagen");
  expect(
    await input.evaluate((el: HTMLInputElement) => el.files?.[0]?.name),
  ).toBe(fixture.name);
  const invalid = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["text"], "invalid.txt", { type: "text/plain" }));
    return data;
  });
  await zone.dispatchEvent("drop", { dataTransfer: invalid });
  await expect(page.locator("#evidence-error")).toHaveText(/PNG, JPG o WebP/);
  expect(
    await input.evaluate((el: HTMLInputElement) => el.files?.[0]?.name),
  ).toBe(fixture.name);
  const multiple = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["one"], "one.png", { type: "image/png" }));
    data.items.add(new File(["two"], "two.png", { type: "image/png" }));
    return data;
  });
  await zone.dispatchEvent("drop", { dataTransfer: multiple });
  await expect(page.locator("#evidence-error")).toHaveText("Adjunta una sola imagen.");
  await input.setInputFiles([]);
  expect(
    await input.evaluate((el: HTMLInputElement) => el.files?.[0]?.name),
  ).toBe(fixture.name);
  await page.getByRole("button", { name: "Quitar imagen" }).click();
  expect(
    await input.evaluate((el: HTMLInputElement) => el.validity.valueMissing),
  ).toBe(true);
  await expect(input).toBeFocused();
  await transfer.dispose();
  await invalid.dispose();
  await multiple.dispose();
});
test("server rejects missing, corrupt or forged evidence and unsafe source URLs", async ({
  page,
}) => {
  const fixture = await imageFixture();
  for (const variant of [
    { evidence: undefined },
    {
      evidence: {
        name: "bad.png",
        mimeType: "image/png",
        buffer: Buffer.from("<svg/>"),
      },
    },
    {
      evidence: {
        name: "image.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      },
    },
    { evidence: fixture, sourceUrl: "javascript:alert(1)" },
    { evidence: fixture, sourceUrl: "https://user:password@example.test" },
  ]) {
    const token = await (await page.request.get("/api/form-token")).json();
    await page.waitForTimeout(1600);
    const fields: Record<
      string,
      string | { name: string; mimeType: string; buffer: Buffer }
    > = {
      description:
        "Relato completamente ficticio para probar el rechazo de un envío inválido.",
      website: "",
      consent: "true",

      token: token.token,
      submissionKey: crypto.randomUUID(),
    };
    if (variant.evidence) fields.evidence = variant.evidence;
    if (variant.sourceUrl) fields.sourceUrl = variant.sourceUrl;
    const response = await page.request.post("/api/denuncias", {
      headers: { origin },
      multipart: fields,
    });
    expect(response.status()).toBe(400);
  }
  const tooLarge = await page.request.post("/api/denuncias", {
    headers: { origin },
    multipart: {
      evidence: {
        name: "big.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(6 * 1024 * 1024 + 1),
      },
    },
  });
  expect(tooLarge.status()).toBe(413);
});
