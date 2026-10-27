import { test, expect } from "@playwright/test";

test("login ADN adapts to screen sizes and password visibility works without submitting", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/auth/login"
    )
      posts++;
  });
  await page.goto("/ingreso");
  await expect(
    page.getByRole("heading", { name: "Acceso del equipo", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nombre de usuario").fill("cuenta-ficticia");
  const password = page.getByLabel("Contraseña", { exact: true });
  await password.fill("clave-ficticia-de-prueba");
  await expect(password).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Mostrar contraseña", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("clave-ficticia-de-prueba");
  await page
    .getByRole("button", { name: "Ocultar contraseña", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByLabel("Nombre de usuario").focus();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Mostrar contraseña", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Ingresar al área privada", exact: true }),
  ).toBeFocused();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(posts).toBe(0);
});

test("login errors are focused and submitting locks the form", async ({
  page,
}) => {
  await page.goto("/ingreso");
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/auth/login", async (route) => {
    await wait;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "No pudimos iniciar sesión. Revisa tus credenciales o consulta con la administración.",
      }),
    });
  });
  await page.getByLabel("Nombre de usuario").fill("cuenta-ficticia");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("clave-ficticia-de-prueba");
  await page
    .getByRole("button", { name: "Ingresar al área privada", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ingresando…" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Nombre de usuario")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Mostrar contraseña", exact: true }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByRole("alert").filter({ hasText: "No pudimos iniciar sesión" }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Ingresar al área privada", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
});

test("login authenticates enabled accounts and preserves the existing session redirect", async ({
  page,
}) => {
  test.skip(!process.env.TEST_PASSWORD, "Requires isolated core fixtures.");
  const prefix = process.env.TEST_PREFIX ?? "test";
  const password = process.env.TEST_PASSWORD!;
  const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
  const denied = await page.request.post("/api/auth/login", {
    headers: { origin },
    data: { username: `${prefix}-disabled`, password },
  });
  expect(denied.status()).toBe(401);
  await page.goto("/ingreso");
  await page.getByLabel("Nombre de usuario").fill(`${prefix}-reviewer`);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Ingresar al área privada", exact: true })
    .click();
  await expect(page).toHaveURL(/\/equipo$/);
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "od_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  await page.goto("/ingreso");
  await expect(page).toHaveURL(/\/equipo$/);
  await expect(
    page.getByRole("heading", { name: "Acceso del equipo", exact: true }),
  ).toHaveCount(0);
});
