import { test, expect, type APIRequestContext } from "./fixtures";
import { execFileSync } from "node:child_process";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const prefix = process.env.TEST_PREFIX ?? "test";
const password = process.env.TEST_PASSWORD!;
const endpoint = "/api/privado/usuarios";
function cli(operation: string, username: string, ...args: string[]) {
  if (process.env.TEST_DEV !== "true") throw Error("Isolated development only");
  return execFileSync(
    "docker",
    [
      "compose",
      "--env-file",
      process.env.TEST_COMPOSE_ENV_FILE!,
      "-p",
      process.env.TEST_COMPOSE_PROJECT!,
      "-f",
      process.env.TEST_COMPOSE_FILE!,
      "exec",
      "-T",
      "app",
      "npm",
      "run",
      "user",
      "--",
      operation,
      username,
      ...args,
    ],
    { encoding: "utf8" },
  );
}
async function login(
  request: APIRequestContext,
  username: string,
  secret = password,
) {
  return request.post("/api/auth/login", {
    headers: { origin },
    data: { username, password: secret },
  });
}
async function lookup(request: APIRequestContext, username: string) {
  const response = await request.get(
    `${endpoint}?buscar=${encodeURIComponent(username)}`,
  );
  expect(response.status()).toBe(200);
  return (await response.json()).find(
    (user: { username: string }) => user.username === username,
  );
}
async function create(
  request: APIRequestContext,
  suffix: string,
  admin = false,
) {
  const response = await request.post(endpoint, {
    headers: { origin },
    data: {
      username: `${prefix}-${suffix}`,
      fullName: `Persona ficticia ${suffix}`,
      password,
      canManageUsers: admin,
    },
  });
  expect(response.status()).toBe(201);
  const row = await response.json();
  expect("password_hash" in row).toBe(false);
  expect("password" in row).toBe(false);
  return row;
}
test.beforeEach(() =>
  test.skip(
    !password || process.env.TEST_DEV !== "true",
    "Isolated core fixtures required.",
  ),
);

test("administration is separate from review; API rejects unauthorized and invalid account changes", async ({
  page,
  browser,
}) => {
  const anon = await browser.newContext();
  expect((await anon.request.get(endpoint)).status()).toBe(401);
  await anon.close();
  expect((await login(page.request, `${prefix}-reviewer`)).status()).toBe(200);
  expect((await page.request.get(endpoint)).status()).toBe(403);
  await page.goto("/equipo/usuarios");
  await expect(
    page.getByRole("heading", { name: "Usuarios", exact: true }),
  ).toHaveCount(0);
  cli("grant-admin", `${prefix}-reviewer`);
  const self = await lookup(page.request, `${prefix}-reviewer`);
  const other = await browser.newContext();
  expect((await login(other.request, `${prefix}-participant`)).status()).toBe(
    200,
  );
  for (const request of [other.request]) {
    expect((await request.get(endpoint)).status()).toBe(403);
    expect(
      (
        await request.post(endpoint, { headers: { origin }, data: {} })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(`${endpoint}/${self.id}`, {
          headers: { origin },
          data: {},
        })
      ).status(),
    ).toBe(403);
    expect(
      (await request.get(`${endpoint}/${self.id}/historial`)).status(),
    ).toBe(403);
  }
  await other.close();
  const data = {
    username: `${prefix}-invalid`,
    fullName: "Persona ficticia",
    password,
    canManageUsers: false,
  };
  expect((await page.request.post(endpoint, { data })).status()).toBe(403);
  for (const invalid of [
    { ...data, fullName: "" },
    { ...data, password: "short" },
    { ...data, role: "reviewer" },
  ])
    expect(
      (
        await page.request.post(endpoint, {
          headers: { origin },
          data: invalid,
        })
      ).status(),
    ).toBe(400);
  const target = await create(page.request, "managed");
  expect(
    (
      await page.request.post(endpoint, {
        headers: { origin },
        data: { ...data, username: target.username },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.patch(`${endpoint}/${self.id}`, {
        headers: { origin },
        data: {
          action: "update",
          fullName: self.full_name,
          enabled: false,
          canManageUsers: true,
          version: self.version,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.patch(`${endpoint}/${self.id}`, {
        headers: { origin },
        data: { action: "reset_password", password, version: self.version },
      })
    ).status(),
  ).toBe(409);
  // Capability-only administration does not grant reviewer access to originals.
  cli("grant-admin", `${prefix}-participant`);
  const adminOnly = await browser.newContext();
  expect(
    (await login(adminOnly.request, `${prefix}-participant`)).status(),
  ).toBe(200);
  expect((await adminOnly.request.get(endpoint)).status()).toBe(200);
  const report = await page.request.post("/api/privado/registros", {
    headers: { origin },
    data: {
      title: "Reporte privado ficticio de permisos",
      description:
        "Relato ficticio sin datos personales para comprobar permisos independientes.",
      submit: true,
    },
  });
  expect(report.status()).toBe(201);
  const { id } = await report.json();
  expect(
    (await adminOnly.request.get(`/api/privado/registros/${id}`)).status(),
  ).toBe(404);
  expect((await adminOnly.request.get("/api/privado/dashboard")).status()).toBe(
    403,
  );
  await adminOnly.close();
});

test("names, web controls, password reset, session revocation and audit work without exposing secrets", async ({
  page,
  browser,
}) => {
  expect((await login(page.request, `${prefix}-reviewer`)).status()).toBe(200);
  cli("grant-admin", `${prefix}-reviewer`);
  await page.goto(`/equipo/usuarios?buscar=${prefix}`);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Crear cuenta", exact: true });
  await modal
    .getByLabel("Nombre completo", { exact: true })
    .fill("Revisora ficticia de prueba");
  const username = `${prefix}-web`;
  await modal.getByLabel("Nombre de usuario", { exact: true }).fill(username);
  await modal.getByLabel("Contraseña", { exact: true }).fill(password);
  await modal
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Cuenta creada.");
  await expect(
    page.getByText("Revisora ficticia de prueba", { exact: true }),
  ).toBeVisible();
  const account = await browser.newContext();
  expect((await login(account.request, username)).status()).toBe(200);
  const accountPage = await account.newPage();
  await accountPage.goto("/equipo");
  await expect(
    accountPage
      .getByRole("banner")
      .getByRole("link", { name: `Cuenta: ${username}` }),
  ).toHaveText("Revisora ficticia de prueba");
  await page
    .getByRole("button", {
      name: "Editar cuenta de Revisora ficticia de prueba",
      exact: true,
    })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Editar cuenta",
    exact: true,
  });
  await editor
    .getByLabel("Nombre completo", { exact: true })
    .fill("Nombre ficticio actualizado");
  await editor
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await expect(
    page.getByText("Nombre ficticio actualizado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Editar cuenta de Nombre ficticio actualizado",
    })
    .click();
  await editor
    .getByRole("button", { name: "Restablecer contraseña", exact: true })
    .click();
  const reset = page.getByRole("dialog", {
    name: "Restablecer contraseña",
    exact: true,
  });
  await expect(reset).toBeVisible();
  const rotated = password + "-rotada";
  await reset.getByLabel("Nueva contraseña", { exact: true }).fill(rotated);
  page.once("dialog", (dialog) => dialog.accept());
  await reset
    .getByRole("button", { name: "Restablecer contraseña", exact: true })
    .click();
  await expect(reset).toHaveCount(0);
  expect((await account.request.get("/api/privado/dashboard")).status()).toBe(
    401,
  );
  expect((await login(account.request, username, password)).status()).toBe(401);
  expect((await login(account.request, username, rotated)).status()).toBe(200);
  await page
    .getByRole("button", {
      name: "Editar cuenta de Nombre ficticio actualizado",
    })
    .click();
  await editor.getByLabel("Cuenta activa", { exact: true }).uncheck();
  page.once("dialog", (dialog) => dialog.accept());
  await editor
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  expect((await account.request.get("/api/privado/dashboard")).status()).toBe(
    401,
  );
  expect((await login(account.request, username, rotated)).status()).toBe(401);
  await page
    .getByRole("button", {
      name: "Editar cuenta de Nombre ficticio actualizado",
    })
    .click();
  await editor.getByLabel("Cuenta activa", { exact: true }).check();
  await editor
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  expect((await login(account.request, username, rotated)).status()).toBe(200);
  const user = await lookup(page.request, username);
  const history = await page.request.get(`${endpoint}/${user.id}/historial`);
  expect(history.status()).toBe(200);
  const entries = await history.json();
  expect(
    entries.some(
      (entry: { action: string }) => entry.action === "password_reset",
    ),
  ).toBe(true);
  const encoded = JSON.stringify(entries);
  expect(encoded.includes(password)).toBe(false);
  expect(encoded.includes(rotated)).toBe(false);
  expect(encoded.includes("password_hash")).toBe(false);
  await page.screenshot({
    path: "artifacts/usuarios-1440.png",
    fullPage: true,
  });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", {
      name: "Editar cuenta de Nombre ficticio actualizado",
    })
    .click();
  await expect(editor).toBeVisible();
  await page.screenshot({ path: "artifacts/usuarios-modal-320.png" });
  await page.keyboard.press("Escape");
  await expect(editor).toHaveCount(0);
  await account.close();
});

test("versions and concurrent administrators cannot leave zero active administrators", async ({
  page,
  browser,
}) => {
  expect((await login(page.request, `${prefix}-reviewer`)).status()).toBe(200);
  cli("grant-admin", `${prefix}-reviewer`);
  // Remove the capability-only fixture administrator, leaving the two explicit contenders.
  const participant = await lookup(page.request, `${prefix}-participant`);
  if (participant.can_manage_users)
    expect(
      (
        await page.request.patch(`${endpoint}/${participant.id}`, {
          headers: { origin },
          data: {
            action: "update",
            fullName: participant.full_name,
            enabled: true,
            canManageUsers: false,
            version: participant.version,
          },
        })
      ).status(),
    ).toBe(200);
  const contender = await create(page.request, "contender", true);
  const secondary = await browser.newContext();
  expect((await login(secondary.request, contender.username)).status()).toBe(
    200,
  );
  const primary = await lookup(page.request, `${prefix}-reviewer`);
  const changes = await Promise.all([
    page.request.patch(`${endpoint}/${contender.id}`, {
      headers: { origin },
      data: {
        action: "update",
        fullName: contender.full_name,
        enabled: true,
        canManageUsers: false,
        version: contender.version,
      },
    }),
    secondary.request.patch(`${endpoint}/${primary.id}`, {
      headers: { origin },
      data: {
        action: "update",
        fullName: primary.full_name,
        enabled: true,
        canManageUsers: false,
        version: primary.version,
      },
    }),
  ]);
  expect(
    changes
      .map((response) => response.status())
      .filter((status) => status === 200),
  ).toHaveLength(1);
  expect(
    changes
      .map((response) => response.status())
      .some((status) => status === 401 || status === 403 || status === 409),
  ).toBe(true);
  const winner = changes[0].status() === 200 ? page.request : secondary.request;
  const manager = await lookup(
    winner,
    changes[0].status() === 200 ? primary.username : contender.username,
  );
  expect(manager.enabled && manager.can_manage_users).toBe(true);
  const target = await lookup(winner, `${prefix}-managed`);
  const update = {
    action: "update",
    fullName: "Edición ficticia",
    enabled: true,
    canManageUsers: false,
    version: target.version,
  };
  const edits = await Promise.all([
    winner.patch(`${endpoint}/${target.id}`, {
      headers: { origin },
      data: update,
    }),
    winner.patch(`${endpoint}/${target.id}`, {
      headers: { origin },
      data: { ...update, fullName: "Otra edición ficticia" },
    }),
  ]);
  expect(edits.map((response) => response.status()).sort()).toEqual([200, 409]);
  let refused = false;
  try {
    cli("disable", manager.username);
  } catch {
    refused = true;
  }
  expect(refused).toBe(true);
  await secondary.close();
});

test("credentials validated before a reset cannot create a session after it commits", async ({
  page,
}) => {
  expect((await login(page.request, `${prefix}-reviewer`)).status()).toBe(200);
  cli("grant-admin", `${prefix}-reviewer`);
  const target = await create(page.request, "credential-race");
  const code = `import {randomBytes} from 'node:crypto';
 import {db} from './src/server/db.ts';
 import {createSession} from './src/server/auth.ts';
 import {updateManagedUser,operateUser} from './src/server/users.ts';
 if(process.env.APP_ORIGIN!=='http://localhost:3100')throw Error('Development only');
 try {
  const actor=(await db.query('SELECT id,username,role,can_manage_users FROM users WHERE username=$1',[process.argv[1]])).rows[0];
  let target=(await db.query('SELECT id,username,password_hash,version FROM users WHERE username=$1',[process.argv[2]])).rows[0];
  const old=target.password_hash;
  await updateManagedUser(actor,target.id,{action:'reset_password',password:randomBytes(24).toString('hex'),version:target.version});
  let rejected=false;try{await createSession(target.id,old);}catch(error){rejected=error.status===401;}
  if(!rejected)throw Error('Stale login was not rejected');
  target=(await db.query('SELECT id,username,password_hash,version FROM users WHERE username=$1',[process.argv[2]])).rows[0];
  const prior=target.password_hash;
  await operateUser(target.username,'reset-password',randomBytes(24).toString('hex'));
  rejected=false;try{await createSession(target.id,prior);}catch(error){rejected=error.status===401;}
  if(!rejected)throw Error('Stale operational login was not rejected');
  if(Number((await db.query('SELECT count(*) FROM sessions WHERE user_id=$1',[target.id])).rows[0].count)!==0)throw Error('Unexpected session');
  await db.query('UPDATE users SET full_name=NULL WHERE id=$1',[target.id]);
  target=(await db.query('SELECT id,version FROM users WHERE id=$1',[target.id])).rows[0];
  const legacy=await updateManagedUser(actor,target.id,{action:'update',fullName:null,enabled:false,canManageUsers:false,version:target.version});
  if(legacy.enabled || legacy.full_name!==null)throw Error('Legacy account cannot be disabled without inventing a name');
  const named=await updateManagedUser(actor,target.id,{action:'update',fullName:'Nombre ficticio recuperado',enabled:true,canManageUsers:false,version:legacy.version});
  rejected=false;try{await updateManagedUser(actor,target.id,{action:'update',fullName:null,enabled:true,canManageUsers:false,version:named.version});}catch(error){rejected=error.status===400;}
  if(!rejected)throw Error('An existing name was cleared');
  console.log('Stale credentials rejected after both reset paths.');
 } finally {await db.end();}`;
  const output = execFileSync(
    "docker",
    [
      "compose",
      "--env-file",
      process.env.TEST_COMPOSE_ENV_FILE!,
      "-p",
      process.env.TEST_COMPOSE_PROJECT!,
      "-f",
      process.env.TEST_COMPOSE_FILE!,
      "exec",
      "-T",
      "app",
      "node",
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      code,
      `${prefix}-reviewer`,
      target.username,
    ],
    { encoding: "utf8" },
  );
  expect(output).toContain("Stale credentials rejected");
});

test("user search and pagination keep the account list bounded", async ({
  page,
}) => {
  expect((await login(page.request, `${prefix}-reviewer`)).status()).toBe(200);
  cli("grant-admin", `${prefix}-reviewer`);
  for (let index = 0; index < 23; index++)
    await create(page.request, `paged-${String(index).padStart(2, "0")}`);
  await page.goto(`/equipo/usuarios?buscar=${prefix}-paged`);
  await expect(
    page
      .getByRole("region", { name: "Listado de usuarios" })
      .getByRole("article"),
  ).toHaveCount(20);
  await page
    .getByRole("navigation", { name: "Paginación de usuarios" })
    .getByRole("link", { name: "Siguiente →" })
    .click();
  await expect(page).toHaveURL(/pagina=2$/);
  await expect(
    page
      .getByRole("region", { name: "Listado de usuarios" })
      .getByRole("article"),
  ).toHaveCount(3);
  await page
    .getByLabel("Buscar por nombre o usuario")
    .fill("Persona ficticia paged-22");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Listado de usuarios" })
      .getByRole("article"),
  ).toHaveCount(1);
  await expect(page).not.toHaveURL(/pagina=/);
});
