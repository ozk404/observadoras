import { test, expect, type Page, type APIRequestContext } from "./fixtures";
import { imageFixture } from "../image-fixture";
import { AI_CONSENT_VERSION } from "../../src/lib/consent";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
async function login(request: APIRequestContext, role = "reviewer") {
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { origin },
        data: {
          username: `${prefix}-${role}`,
          password: process.env.TEST_PASSWORD,
        },
      })
    ).status(),
  ).toBe(200);
}
const endpoint = (id: string) => `/api/privado/registros/${id}/publicacion`;
const text = {
  title: `Publicación de prueba ${prefix}`,
  body: "Versión pública sintética aprobada, distinta del original privado del reporte.",
  summary: "Resumen público de prueba.",
  context: "Contexto público de prueba.",
  findings: "Hallazgos de prueba.",
  analysis: "Análisis humano de prueba.",
  limitations: "No se han verificado hechos reales.",
  categories: ["desinformacion"],
  privacyConfirmed: true,
  publicationConfirmed: true,
};
async function publish(page: Page) {
  await login(page.request);
  const key = crypto.randomUUID();
  const { token } = await (await page.request.get("/api/form-token")).json();
  await page.waitForTimeout(1600);
  expect(
    (
      await page.request.post("/api/denuncias", {
        headers: { origin },
        multipart: {
          description:
            "Original ficticio privado con contexto reservado para probar la separación de versiones.",
          sourceUrl: "",
          consent: "true",
          consentVersion: AI_CONSENT_VERSION,
          website: "",
          token,
          submissionKey: key,
          evidence: await imageFixture(),
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/equipo");
  await page
    .getByRole("heading", {
      name: `Reporte recibido · ${key.slice(0, 8)}`,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/equipo\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  expect(
    (
      await page.request.post(`/api/privado/registros/${id}/validacion`, {
        headers: { origin },
        data: { version: 1, confirmed: true },
      })
    ).status(),
  ).toBe(200);
  const approved = await page.request.post(endpoint(id), {
    headers: { origin },
    data: { ...text, version: 2 },
  });
  expect(approved.status()).toBe(201);
  const publicationId = (await approved.json()).id as string;
  expect(
    (
      await page.request.put(`/api/privado/registros/${id}/imagen-publica`, {
        headers: { origin },
        multipart: {
          version: "0",
          imageSource: "original",
          description: "Captura ficticia aprobada.",
          confirmed: "true",
        },
      })
    ).status(),
  ).toBe(200);
  return { id, publicationId };
}
test("reviewer corrects, withdraws and explicitly republishes without restoring the removed image or losing the original", async ({
  page,
  browser,
}) => {
  const { id, publicationId } = await publish(page);
  const initial = await (await page.request.get(endpoint(id))).json();
  const asset = initial.image.asset_id;
  const original = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  await page.goto(`/equipo/${id}`);
  await page
    .getByRole("button", { name: "Corregir publicación", exact: true })
    .click();
  const form = page.getByRole("form", { name: "Corregir versión pública" });
  await expect(form.getByLabel("Resumen público", { exact: true })).toHaveValue(
    text.summary,
  );
  const body =
    "Texto corregido ficticio y aprobado por una persona, separado de las notas internas.";
  await form.getByLabel("Versión pública revisada", { exact: true }).fill(body);
  await form
    .getByLabel("Motivo del cambio (interno)")
    .fill("Motivo privado ficticio de corrección solicitado por correo.");
  await form.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await form.getByRole("checkbox", { name: /Apruebo esta versión/ }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/publication-correction-mobile.png",
    fullPage: true,
  });
  let release:()=>void=()=>{};
  const blocked=new Promise<void>(resolve=>{release=resolve});
  await page.route("**/equipo/**",async route=>{
    if(route.request().headers()["rsc"]==="1") await blocked;
    await route.continue();
  });
  try {
  await form
    .getByRole("button", { name: "Aprobar corrección", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Corrección publicada.");
  const visitor = await browser.newContext();
  let publicPage = await visitor.request.get(
    `${origin}/reportes/${publicationId}`,
  );
  expect(await publicPage.text()).toContain(body);
  expect(await publicPage.text()).not.toContain("Motivo privado ficticio");
  await page
    .getByRole("button", { name: "Retirar publicación", exact: true })
    .click();
  const removal = page.getByRole("form", {
    name: "Retirar publicación",
    exact: true,
  });
  await removal
    .getByLabel("Motivo de la retirada (interno)")
    .fill("Solicitud privada ficticia de retirada por correo.");
  await removal.getByRole("checkbox").check();
  await removal
    .getByRole("button", { name: "Confirmar retirada", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Publicación retirada", exact: true }),
  ).toBeVisible();
  expect(
    (await visitor.request.get(`${origin}/reportes/${publicationId}`)).status(),
  ).toBe(404);
  const catalog = await (
    await visitor.request.get(`${origin}/reportes`)
  ).text();
  expect(catalog).not.toContain(publicationId);
  expect(
    (
      await visitor.request.get(`${origin}/api/imagenes-publicas/${asset}`)
    ).status(),
  ).toBe(404);
  expect(
    (
      await visitor.request.get(
        `${origin}/api/imagenes-publicas/${asset}?vista=miniatura`,
      )
    ).status(),
  ).toBe(404);
  expect(
    (await page.request.get(`/api/privado/registros/${id}/evidencia`)).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Revisar y volver a publicar", exact: true })
    .click();
  await form
    .getByLabel("Motivo del cambio (interno)")
    .fill("Nueva revisión humana ficticia y autorización expresa.");
  await form.getByRole("checkbox", { name: /Revisé los hechos/ }).check();
  await form.getByRole("checkbox", { name: /Apruebo esta versión/ }).check();
  await form
    .getByRole("button", { name: "Aprobar y volver a publicar", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Publicación restablecida.",
  );
  expect(
    (await visitor.request.get(`${origin}/reportes/${publicationId}`)).status(),
  ).toBe(200);
  expect(
    (
      await visitor.request.get(`${origin}/api/imagenes-publicas/${asset}`)
    ).status(),
  ).toBe(404);
  const final = await (await page.request.get(endpoint(id))).json();
  expect(final.events.map((e: { action: string }) => e.action)).toEqual([
    "republished",
    "withdrawn",
    "corrected",
    "published",
  ]);
  expect(final.publication.summary).toBe(text.summary);
  expect(final.image.asset_id).toBeNull();
  const kept = await (
    await page.request.get(`/api/privado/registros/${id}`)
  ).json();
  expect(kept.description).toBe(original.description);
  expect(kept.version).toBe(original.version);
  await visitor.close();
  } finally { release(); await page.unrouteAll({behavior:"wait"}); }
});
test("publication changes reject unauthorized, unconfirmed, stale and foreign-origin requests; concurrency permits one change", async ({
  page,
  browser,
}) => {
  const { id } = await publish(page);
  const data = {
    content: { ...text, version: 1 },
    reason: "Motivo interno ficticio para comprobar concurrencia.",
    restore: false,
  };
  const visitor = await browser.newContext();
  expect((await visitor.request.get(`${origin}${endpoint(id)}`)).status()).toBe(
    401,
  );
  await login(visitor.request, "participant");
  for (const method of ["GET", "PATCH", "DELETE"])
    expect(
      (
        await visitor.request.fetch(`${origin}${endpoint(id)}`, {
          method,
          headers: { origin },
          data:
            method === "PATCH"
              ? data
              : { version: 1, reason: data.reason, confirmed: true },
        })
      ).status(),
    ).toBe(403);
  expect(
    (
      await page.request.patch(endpoint(id), {
        headers: { origin: "https://foreign.example" },
        data,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.patch(endpoint(id), {
        headers: { origin },
        data: {
          ...data,
          content: { ...data.content, privacyConfirmed: false },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.patch(endpoint(id), {
        headers: { origin },
        data: { ...data, content: { ...data.content, version: 99 } },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(endpoint(id), {
        headers: { origin },
        data: { version: 1, reason: data.reason, confirmed: false },
      })
    ).status(),
  ).toBe(400);
  const responses = await Promise.all([
    page.request.patch(endpoint(id), { headers: { origin }, data }),
    page.request.delete(endpoint(id), {
      headers: { origin },
      data: { version: 1, reason: data.reason, confirmed: true },
    }),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  const final = await (await page.request.get(endpoint(id))).json();
  expect(final.publication.version).toBe(2);
  expect(final.events).toHaveLength(2);
  await visitor.close();
});
