import { test, expect, type BrowserContext, type Page } from "@playwright/test";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
const password = process.env.TEST_PASSWORD;
async function authenticate(context: BrowserContext, role: string) {
  const response = await context.request.post("/api/auth/login", {
    headers: { origin },
    data: { username: `${prefix}-${role}`, password },
  });
  expect(response.status()).toBe(200);
}
async function create(context: BrowserContext, title: string, submit = false) {
  const response = await context.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title,
      description:
        "Descripción original completamente ficticia para comprobar filtros y permisos del listado.",
      submit,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}
async function count(page: Page, label: string) {
  const link = page
    .getByRole("navigation", { name: "Filtrar reportes por estado" })
    .getByRole("link", { name: new RegExp(`^${label} \\d`) });
  return Number(await link.locator("span").innerText());
}

test("team queue filters, counts and pagination respect both roles and fit the ADN layout", async ({
  page,
  browser,
}) => {
  test.skip(!password, "Requires isolated core fixtures.");
  await page.goto("/equipo");
  await expect(page).toHaveURL(/\/ingreso$/);
  await authenticate(page.context(), "reviewer");
  await page.goto("/equipo/nuevo");
  await expect(page).toHaveURL("/reportar");
  await page.goto("/equipo");
  await expect(page.getByRole("link", { name: "Nuevo registro" })).toHaveCount(
    0,
  );
  const header = page.getByRole("banner");
  await expect(
    header.getByRole("link", { name: `Cuenta: ${prefix}-reviewer` }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", { name: "Cerrar sesión" }),
  ).toBeVisible();
  await expect(
    header.getByRole("link", { name: "Acceso del equipo ↗" }),
  ).toBeHidden();
  const baseline = {
    total: await count(page, "Todos"),
    pending: await count(page, "Pendientes"),
    drafts: await count(page, "Borradores"),
  };
  const participant = await browser.newContext();
  const other = await browser.newContext();
  try {
    await authenticate(participant, "participant");
    await authenticate(other, "other");
    const mine = await participant.newPage();
    await mine.goto("/equipo");
    await expect(
      mine.getByRole("heading", { name: "Mis reportes", exact: true }),
    ).toBeVisible();
    const mineBefore: Record<string, number> = {};
    for (const label of [
      "Todos",
      "Borradores",
      "Pendientes",
      "Por ajustar",
      "Validados",
      "Publicados",
    ])
      mineBefore[label] = await count(mine, label);
    if (mineBefore.Todos === 0) {
      await expect(
        mine.getByRole("heading", { name: "Aún no hay reportes." }),
      ).toBeVisible();
    } else {
      await mine.goto("/equipo?pagina=999");
      await expect(
        mine.getByRole("heading", { name: "No hay reportes en esta página." }),
      ).toBeVisible();
    }
    await mine.screenshot({
      path: "artifacts/equipo-v2-empty.png",
      fullPage: true,
    });
    const ownDraft = await create(
      participant,
      `Borrador privado propio ${prefix}`,
    );
    const foreignDraft = await create(other, `Borrador ajeno ${prefix}`);
    const ids: string[] = [];
    for (let index = 0; index < 24; index++)
      ids.push(
        await create(
          participant,
          `Pendiente ficticio ${prefix} ${index}`,
          true,
        ),
      );
    await create(other, `Envío visible de otra participante ${prefix}`, true);
    const reviewerDraftTitle = `Borrador de revisión ${prefix} ${"x".repeat(65)}`;
    await create(page.context(), reviewerDraftTitle);
    for (const index of [0, 1]) {
      const result = await page.request.post(
        `/api/privado/registros/${ids[index]}/validacion`,
        {
          headers: { origin },
          data: {
            confirmed: true,
            version: 1,
            reviewedCategories: [],
            reviewObservation: "Revisión ficticia del filtro.",
          },
        },
      );
      expect(result.status()).toBe(200);
    }
    expect(
      (
        await page.request.post(
          `/api/privado/registros/${ids[1]}/publicacion`,
          {
            headers: { origin },
            data: {
              title: `Publicación ficticia ${prefix}`,
              body: "Síntesis pública ficticia revisada para probar el filtro de publicaciones.",
              privacyConfirmed: true,
              publicationConfirmed: true,
              version: 2,
            },
          },
        )
      ).status(),
    ).toBe(201);
    expect(
      (
        await page.request.post(`/api/privado/registros/${ids[2]}/ajustes`, {
          headers: { origin },
          data: {
            note: "Observación ficticia para comprobar el estado de ajustes.",
            confirmed: true,
            version: 1,
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/equipo");
    expect(await count(page, "Todos")).toBe(baseline.total + 26);
    expect(await count(page, "Pendientes")).toBe(baseline.pending + 22);
    expect(await count(page, "Borradores")).toBe(baseline.drafts + 1);
    await expect(
      page.getByRole("heading", { name: reviewerDraftTitle, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: `Borrador ajeno ${prefix}`,
        exact: true,
      }),
    ).toHaveCount(0);
    for (const id of [ownDraft, foreignDraft])
      expect(
        (await page.request.get(`/api/privado/registros/${id}`)).status(),
      ).toBe(404);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: `artifacts/equipo-v2-${width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("navigation", { name: "Filtrar reportes por estado" })
      .getByRole("link", { name: /^Borradores / })
      .click();
    await expect(
      page.getByRole("heading", { name: reviewerDraftTitle, exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Listado de reportes" })
        .getByRole("listitem"),
    ).toHaveCount(Math.min(20, baseline.drafts + 1));
    await mine.goto("/equipo");
    for (const [label, total] of [
      ["Todos", 25],
      ["Borradores", 1],
      ["Pendientes", 21],
      ["Por ajustar", 1],
      ["Validados", 1],
      ["Publicados", 1],
    ] as const)
      expect(await count(mine, label)).toBe(mineBefore[label] + total);
    await expect(
      mine.getByRole("navigation", { name: "Área de revisión" }),
    ).toHaveCount(0);
    await mine.goto("/equipo?estado=pending");
    const listing = mine.getByRole("region", { name: "Listado de reportes" });
    await expect(listing.getByRole("listitem")).toHaveCount(20);
    const next = mine
      .getByRole("navigation", { name: "Paginación de reportes" })
      .getByRole("link", { name: "Siguiente →" });
    expect(await next.getAttribute("href")).toContain("estado=pending");
    await next.click();
    await expect(mine).toHaveURL(/estado=pending&pagina=2$/);
    await expect(listing.getByRole("listitem")).toHaveCount(
      Math.min(20, mineBefore.Pendientes + 1),
    );
    await expect(
      mine.getByRole("heading", {
        name: `Pendiente ficticio ${prefix} 3`,
        exact: true,
      }),
    ).toBeVisible();
    await mine
      .getByRole("navigation", { name: "Filtrar reportes por estado" })
      .getByRole("link", { name: /^Validados / })
      .click();
    await expect(mine).toHaveURL(/estado=validated$/);
    await expect(listing.getByRole("listitem")).toHaveCount(
      Math.min(20, mineBefore.Validados + 1),
    );
    await mine
      .getByRole("heading", {
        name: `Pendiente ficticio ${prefix} 0`,
        exact: true,
      })
      .click();
    await expect(mine).toHaveURL(`/equipo/${ids[0]}`);
    await mine.goto("/equipo?estado=draft");
    await expect(
      mine.getByRole("heading", {
        name: `Borrador privado propio ${prefix}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      mine.getByRole("heading", {
        name: `Borrador ajeno ${prefix}`,
        exact: true,
      }),
    ).toHaveCount(0);
    await mine.goto("/equipo?estado=invalid%27%20OR%201%3D1");
    expect(await count(mine, "Todos")).toBe(mineBefore.Todos + 25);
    await expect(
      mine
        .getByRole("navigation", { name: "Filtrar reportes por estado" })
        .getByRole("link", { name: /^Todos / }),
    ).toHaveAttribute("aria-current", "page");
    await mine.goto("/equipo?estado=pending&pagina=999");
    await expect(
      mine.getByRole("heading", { name: "No hay reportes en esta página." }),
    ).toBeVisible();
    await mine
      .getByRole("link", { name: "Ver todos los reportes", exact: true })
      .click();
    await expect(mine).toHaveURL("/equipo");
  } finally {
    await participant.close();
    await other.close();
  }
});
