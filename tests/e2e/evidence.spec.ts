import { test, expect } from "@playwright/test";
import { imageFixture } from "../image-fixture";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
test("public form requires an image, accepts a private preview and works on mobile", async ({
  page,
}) => {
  await page.goto("/reportar");
  await expect(page.getByLabel("Título breve")).toHaveCount(0);
  await expect(
    page.getByLabel("Captura o imagen"),
  ).toHaveAttribute("required", "");
  await expect(
    page.getByLabel("URL de la publicación o fuente"),
  ).not.toHaveAttribute("required");
  await page
    .getByLabel("Captura o imagen")
    .setInputFiles(await imageFixture());
  await expect(
    page.getByRole("img", {
      name: "Vista previa de la imagen que vas a enviar",
    }),
  ).toBeVisible();
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
