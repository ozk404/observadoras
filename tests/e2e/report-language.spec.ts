import { test, expect } from "@playwright/test";
test("report terminology, consent and old links use the public report routes", async ({page}) => {
  for (const [oldPath, expected] of [["/denuncia", "/reportar"], ["/denuncias?pagina=2", "/reportes?pagina=2"], ["/denuncias/00000000-0000-4000-8000-000000000001", "/reportes/00000000-0000-4000-8000-000000000001"]]) {
    const response = await page.request.get(oldPath, {maxRedirects:0});
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, page.url().startsWith("http") ? page.url() : process.env.TEST_BASE_URL ?? "http://localhost:3100").pathname + new URL(response.headers().location, process.env.TEST_BASE_URL ?? "http://localhost:3100").search).toBe(expected);
  }
  await page.goto("/reportar");
  await expect(page.getByRole("heading", {name:"Enviar un reporte"})).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByRole("checkbox", {name:/Autorizo el análisis.*OpenAI/})).toBeVisible();
  await expect(page.getByText(/no presenta una denuncia penal/)).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/fictici[oa]|solo.*pruebas/i);
  await page.goto("/privacidad");
  await expect(page.getByText(/Se registra tu aceptación/)).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/fictici[oa]|deshabilitado/i);
});
