import { test, expect, type Page } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(page: Page, role = "dashboard-reviewer") {
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-${role}`);
  await page.getByLabel("Contraseña").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al área privada" }).click();
  await expect(page).toHaveURL(/\/equipo$/);
}
test("private summary uses human validation, consistent chart/table data and working period/group controls", async ({
  page,
}) => {
  await login(page);
  const initial = await (
    await page.request.get("/api/privado/dashboard")
  ).json();
  await page.getByRole("link", { name: "Resumen", exact: true }).click();
  await expect(page.getByTestId("dashboard-total")).toHaveText(String(initial.total));
  if (initial.total === 0) {
    await expect(page.getByText("Sin reportes validados en este período.")).toBeVisible();
    await expect(page.getByRole("table").getByText("Sin datos para este período.")).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(/NaN|Infinity/);
  }
  await page.goto("/equipo");
  const secret = `Original ficticio privado ${prefix} que nunca debe aparecer en el resumen.`;
  for (const [submit, validate, publish] of [
    [true, true, false],
    [true, true, true],
    [true, false, false],
    [false, false, false],
  ]) {
    const created = await page.request.post("/api/privado/registros", {
      headers: { origin },
      data: {
        title: `Fixture de resumen ${prefix}`,
        description: secret,
        submit,
      },
    });
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    if (validate)
      expect(
        (
          await page.request.post(`/api/privado/registros/${id}/validacion`, {
            headers: { origin },
            data: {
              version: 1,
              confirmed: true,
              reviewedCategories: ["acoso", "amenaza"],
              reviewObservation:
                "Observación ficticia privada, fuera del resumen.",
            },
          })
        ).status(),
      ).toBe(200);
    if (publish)
      expect(
        (
          await page.request.post(`/api/privado/registros/${id}/publicacion`, {
            headers: { origin },
            data: {
              version: 2,
              title: `Publicación ficticia ${prefix}`,
              body: "Versión pública ficticia independiente del agregado de revisión.",
              privacyConfirmed: true,
              publicationConfirmed: true,
            },
          })
        ).status(),
      ).toBe(201);
  }
  const response = await page.request.get("/api/privado/dashboard");
  expect(response.headers()["cache-control"]).toContain("no-store");
  const data = await response.json();
  expect(data.total).toBe(initial.total + 2);
  for (const key of ["acoso", "amenaza"])
    expect(data.rows.find((r: { key: string }) => r.key === key).count).toBe(
      (initial.rows.find((r: { key: string }) => r.key === key)?.count ?? 0) +
        2,
    );
  expect(JSON.stringify(data)).not.toContain(secret);
  await page.getByRole("link", { name: "Resumen", exact: true }).click();
  await expect(page.getByTestId("dashboard-total")).toHaveText(
    String(data.total),
  );
  expect(await page.locator("body").innerText()).not.toContain(secret);
  const table = page.getByRole("table");
  for (const row of data.rows) {
    const tr = table
      .getByRole("row")
      .filter({
        has: page.getByRole("rowheader", { name: row.label, exact: true }),
      });
    await expect(tr.getByRole("cell").first()).toHaveText(String(row.count));
    await expect(
      page
        .locator(".dashboard-bars li")
        .filter({ hasText: row.label })
        .locator("strong"),
    ).toHaveText(String(row.count));
  }
  await page.getByLabel("Fecha de validación").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Agrupar por")).toBeFocused();
  await page.getByLabel("Fecha de validación").selectOption("todo");
  await page.getByLabel("Agrupar por").selectOption("estado");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page).toHaveURL(/periodo=todo&agrupar=estado/);
  await expect(
    page.getByRole("heading", { name: "Estado del reporte" }),
  ).toBeVisible();
  const states = await (
    await page.request.get("/api/privado/dashboard?periodo=todo&agrupar=estado")
  ).json();
  expect(
    states.rows.reduce((n: number, r: { count: number }) => n + r.count, 0),
  ).toBe(states.total);
  await expect(page.getByTestId("dashboard-total")).toHaveText(
    String(states.total),
  );
  await page.getByRole("link", { name: "Restablecer", exact: true }).click();
  await expect(page).toHaveURL(/\/equipo\/dashboard$/);
  await expect(page.getByLabel("Fecha de validación")).toHaveValue("30");
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
});
test("summary rejects visitors, participants and invalid or duplicate filters", async ({
  page,
  browser,
}) => {
  expect((await page.request.get("/api/privado/dashboard")).status()).toBe(401);
  await page.goto("/equipo/dashboard");
  await expect(page).toHaveURL(/\/ingreso$/);
  await login(page, "participant");
  await expect(
    page.getByRole("link", { name: "Resumen", exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get("/api/privado/dashboard")).status()).toBe(403);
  expect((await page.goto("/equipo/dashboard"))?.status()).toBe(404);
  const context = await browser.newContext();
  const reviewer = await context.newPage();
  await login(reviewer);
  for (const query of [
    "periodo=0",
    "periodo=30&periodo=90",
    "agrupar=estado&agrupar=estado",
    "autor=forged",
    "agrupar=riesgo",
  ]) {
    const response = await reviewer.request.get(
      `/api/privado/dashboard?${query}`,
    );
    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).not.toContain("rows");
    await reviewer.goto(`/equipo/dashboard?${query}`);
    await expect(reviewer.getByText("Filtros no válidos.", {exact:true})).toBeVisible();
    await expect(reviewer.getByTestId("dashboard-total")).toHaveCount(0);
  }
  await context.close();
});
