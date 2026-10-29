import { AI_CONSENT_VERSION } from "../../src/lib/consent";
import { test, expect } from "./fixtures";
import sharp from "sharp";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
const sizes = [
  { name: "horizontal", width: 1200, height: 500 },
  { name: "vertical", width: 500, height: 1200 },
  { name: "cuadrada", width: 900, height: 900 },
  { name: "larga", width: 400, height: 2400 },
];
async function fixture(width: number, height: number) {
  const raw = Buffer.alloc(width * height * 3);
  let value = 81;
  for (let index = 0; index < raw.length; index++) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    raw[index] = value >>> 24;
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

test("private thumbnails preserve proportions and enlarge without leaving the queue", async ({
  page,
  browser,
}) => {
  test.skip(!process.env.TEST_PASSWORD, "Requires isolated core fixtures.");
  const anonymous = await browser.newContext();
  const participant = await browser.newContext();
  const cases: Array<{
    name: string;
    width: number;
    height: number;
    title: string;
    id: string;
  }> = [];
  try {
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
    expect(
      (
        await participant.request.post("/api/auth/login", {
          headers: { origin },
          data: {
            username: `${prefix}-participant`,
            password: process.env.TEST_PASSWORD,
          },
        })
      ).status(),
    ).toBe(200);
    for (const size of sizes) {
      const key = crypto.randomUUID();
      const token = await (
        await anonymous.request.get("/api/form-token")
      ).json();
      const png = await fixture(size.width, size.height);
      await page.waitForTimeout(1600);
      const sent = await anonymous.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description: `Captura ${size.name} completamente ficticia para comprobar la vista previa privada.`,
          sourceUrl: "",
          consent: "true", consentVersion: AI_CONSENT_VERSION,
          website: "",
          token: token.token,
          submissionKey: key,
          evidence: {
            name: `ficticia-${size.name}.png`,
            mimeType: "image/png",
            buffer: png,
          },
        },
      });
      expect(sent.status()).toBe(201);
      cases.push({
        ...size,
        title: `Reporte recibido · ${key.slice(0, 8)}`,
        id: "",
      });
    }
    const noImage = await page.request.post("/api/privado/registros", {
      headers: { origin },
      data: {
        title: `Registro ficticio sin captura ${prefix}`,
        description:
          "Registro interno ficticio sin imagen para comprobar su representación.",
        submit: true,
      },
    });
    expect(noImage.status()).toBe(201);
    await page.goto("/equipo?estado=pending");
    for (const item of cases) {
      const href = await page
        .getByRole("heading", { name: item.title, exact: true })
        .getByRole("link")
        .getAttribute("href");
      item.id = href!.split("/").at(-1)!;
    }
    await Promise.all(
      cases.map(async (item) => {
        const source = `/api/privado/registros/${item.id}/evidencia`;
        for (const suffix of ["", "?vista=miniatura"]) {
          expect((await anonymous.request.get(source + suffix)).status()).toBe(
            401,
          );
          expect(
            (await participant.request.get(source + suffix)).status(),
          ).toBe(404);
        }
        const preview = await page.request.get(`${source}?vista=miniatura`);
        expect(preview.status()).toBe(200);
        expect(preview.headers()["cache-control"]).toBe("private, no-store");
        expect(
          preview
            .headers()
            ["vary"].split(",")
            .map((value) => value.trim()),
        ).toContain("Cookie");
        const thumbnail = await preview.body();
        const small = await sharp(thumbnail).metadata();
        expect(small.format).toBe("webp");
        expect(small.width).toBeLessThanOrEqual(256);
        expect(small.height).toBeLessThanOrEqual(192);
        expect(
          Math.abs(small.width! / small.height! - item.width / item.height),
        ).toBeLessThan(0.025);
        const full = await page.request.get(source);
        const fullBuffer = await full.body();
        const metadata = await sharp(fullBuffer).metadata();
        expect(metadata.width).toBe(item.width);
        expect(metadata.height).toBe(item.height);
        expect(thumbnail.length).toBeLessThan(fullBuffer.length);
      }),
    );
    const originals: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith("/evidencia") && !url.search)
        originals.push(url.pathname);
    });
    await page.reload();
    const missing = page.getByRole("listitem").filter({
      has: page.getByRole("heading", {
        name: `Registro ficticio sin captura ${prefix}`,
        exact: true,
      }),
    });
    await expect(
      missing.getByRole("button", { name: /Ampliar captura/ }),
    ).toHaveCount(0);
    expect(originals).toHaveLength(0);
    for (const [index, item] of cases.entries()) {
      const trigger = page.getByRole("button", {
        name: `Ampliar captura de ${item.title}`,
        exact: true,
      });
      await trigger.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          trigger
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(trigger.locator("img")).toHaveCSS("object-fit", "contain");
      const queueUrl = page.url();
      const overflow = await page.evaluate(
        () => document.documentElement.style.overflow,
      );
      await trigger.click();
      const modal = page.getByRole("dialog", { name: "Captura adjunta" });
      await expect(modal).toBeVisible();
      await expect(page).toHaveURL(queueUrl);
      const full = modal.getByRole("img", {
        name: "Captura completa del reporte",
      });
      await expect
        .poll(() =>
          full.evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBe(item.width);
      await expect(
        modal.getByRole("button", { name: "Cerrar captura" }),
      ).toBeFocused();
      expect(
        await page.evaluate(() => document.documentElement.style.overflow),
      ).toBe("hidden");
      if (item.name === "larga") {
        await page.setViewportSize({ width: 320, height: 844 });
        await modal.getByRole("button", { name: "Tamaño real" }).click();
        expect(
          await full.evaluate(
            (image) =>
              image.parentElement!.scrollHeight >
              image.parentElement!.clientHeight,
          ),
        ).toBe(true);
        await modal.getByRole("button", { name: "Ajustar a pantalla" }).click();
        const bounds = await modal.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
        await page.screenshot({
          path: "artifacts/equipo-captura-ampliada-mobile.png",
        });
        await page.keyboard.press("Escape");
      } else {
        await page.setViewportSize({ width: 1440, height: 1000 });
        if (index === 0)
          await page.screenshot({
            path: "artifacts/equipo-captura-ampliada-desktop.png",
          });
        await modal.getByRole("button", { name: "Cerrar captura" }).click();
      }
      await expect(modal).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(
        await page.evaluate(() => document.documentElement.style.overflow),
      ).toBe(overflow);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    expect(originals.length).toBeGreaterThanOrEqual(4);
    await page.goto("/equipo?estado=pending");
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/equipo-miniaturas-${width}.png`,
      });
    }
    const broken = cases[0];
    await page.route(
      `**/api/privado/registros/${broken.id}/evidencia?vista=miniatura`,
      (route) => route.fulfill({ status: 503, body: "" }),
    );
    await page.reload();
    const failedRow = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { name: broken.title, exact: true }),
    });
    await failedRow.scrollIntoViewIfNeeded();
    await expect(
      failedRow.getByRole("img", { name: "Captura no disponible" }),
    ).toBeVisible();
    await expect(
      failedRow.getByRole("button", { name: /Ampliar captura/ }),
    ).toHaveCount(0);
    await failedRow
      .getByRole("heading", { name: broken.title, exact: true })
      .click();
    await expect(page).toHaveURL(`/equipo/${broken.id}`);
  } finally {
    await anonymous.close();
    await participant.close();
  }
});
