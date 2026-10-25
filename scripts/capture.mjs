import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
for (const [name, path] of [
  ["inicio", "/"],
  ["denuncia", "/denuncia"],
  ["catalogo", "/denuncias"],
]) {
  await page.goto(`http://localhost:3000${path}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `artifacts/${name}-desktop.png`,
    fullPage: true,
  });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000");
await page.screenshot({ path: "artifacts/inicio-mobile.png", fullPage: true });
await browser.close();
