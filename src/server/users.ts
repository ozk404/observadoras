import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PoolClient } from "pg";
import { db } from "./db";
import type { User } from "./auth";
import { hashPassword } from "./password";
import { HttpError } from "./security";
export const fullName = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Nombre no válido.");
export const createUserInput = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,64}$/),
    fullName,
    password: z.string().min(14).max(128),
    canManageUsers: z.boolean(),
  })
  .strict();
export const updateUserInput = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("update"),
      fullName: fullName.nullable(),
      enabled: z.boolean(),
      canManageUsers: z.boolean(),
      version: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal("reset_password"),
      password: z.string().min(14).max(128),
      version: z.number().int().positive(),
    })
    .strict(),
]);
export type ManagedUser = {
  id: string;
  username: string;
  full_name: string | null;
  role: "participant" | "reviewer";
  enabled: boolean;
  can_manage_users: boolean;
  version: number;
  created_at: Date;
};
const columns =
  "id,username,full_name,role,enabled,can_manage_users,version,created_at";
export function assertManager(user: User) {
  if (user.can_manage_users !== true)
    throw new HttpError(403, "No tienes permiso para administrar usuarios.");
}
async function event(
  client: PoolClient,
  actor: string | null,
  target: string,
  action: string,
  fields: string[],
  origin = "web",
) {
  await client.query(
    "INSERT INTO user_events(id,actor_id,target_id,action,changed_fields,origin) VALUES($1,$2,$3,$4,$5,$6)",
    [randomUUID(), actor, target, action, fields, origin],
  );
}
async function managed<T>(
  actor: User,
  work: (client: PoolClient) => Promise<T>,
) {
  assertManager(actor);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(841028)");
    const current = (
      await client.query(
        "SELECT enabled,can_manage_users FROM users WHERE id=$1 FOR UPDATE",
        [actor.id],
      )
    ).rows[0];
    if (!current?.enabled || !current.can_manage_users)
      throw new HttpError(
        403,
        "Tu acceso administrativo ya no está disponible.",
      );
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505")
      throw new HttpError(409, "Ese nombre de usuario ya existe.");
    throw error;
  } finally {
    client.release();
  }
}
export async function listUsers(actor: User, page = 1, search = "") {
  assertManager(actor);
  const term = search
    .trim()
    .slice(0, 100)
    .replace(/[\\%_]/g, "\\$&");
  const rows = await db.query<ManagedUser>(
    `SELECT ${columns} FROM users WHERE username ILIKE $1 OR full_name ILIKE $1 ORDER BY enabled DESC,lower(coalesce(full_name,username)),id LIMIT 21 OFFSET $2`,
    [`%${term}%`, (page - 1) * 20],
  );
  return rows.rows;
}
export async function createManagedUser(actor: User, input: unknown) {
  assertManager(actor);
  const data = createUserInput.parse(input);
  const hash = await hashPassword(data.password);
  return managed(actor, async (client) => {
    const row = (
      await client.query<ManagedUser>(
        `INSERT INTO users(id,username,full_name,password_hash,role,can_manage_users) VALUES($1,$2,$3,$4,'reviewer',$5) RETURNING ${columns}`,
        [randomUUID(), data.username, data.fullName, hash, data.canManageUsers],
      )
    ).rows[0];
    await event(client, actor.id, row.id, "created", [
      "username",
      "full_name",
      "role",
      "can_manage_users",
    ]);
    return row;
  });
}
async function preserveAdmin(
  client: PoolClient,
  target: ManagedUser,
  enabled: boolean,
  canManage: boolean,
) {
  if (target.enabled && target.can_manage_users && (!enabled || !canManage)) {
    const count = Number(
      (
        await client.query(
          "SELECT count(*) FROM users WHERE enabled AND can_manage_users AND id<>$1",
          [target.id],
        )
      ).rows[0].count,
    );
    if (!count)
      throw new HttpError(
        409,
        "Debe quedar al menos una persona administradora activa.",
      );
  }
}
export async function updateManagedUser(
  actor: User,
  id: string,
  input: unknown,
) {
  assertManager(actor);
  z.string().uuid().parse(id);
  const data = updateUserInput.parse(input);
  if (data.action === "reset_password" && id === actor.id)
    throw new HttpError(
      409,
      "Pide a otra persona administradora que restablezca tu contraseña.",
    );
  const hash =
    data.action === "reset_password" ? await hashPassword(data.password) : null;
  return managed(actor, async (client) => {
    const target = (
      await client.query<ManagedUser>(
        `SELECT ${columns} FROM users WHERE id=$1 FOR UPDATE`,
        [id],
      )
    ).rows[0];
    if (!target) throw new HttpError(404, "La cuenta no existe.");
    if (target.version !== data.version)
      throw new HttpError(409, "La cuenta cambió. Recarga antes de guardar.");
    if (data.action === "reset_password") {
      await client.query(
        "UPDATE users SET password_hash=$2,version=version+1 WHERE id=$1",
        [id, hash],
      );
      await client.query("DELETE FROM sessions WHERE user_id=$1", [id]);
      await event(client, actor.id, id, "password_reset", ["password"]);
    } else {
      if (target.full_name && data.fullName === null)
        throw new HttpError(400, "El nombre no se puede dejar vacío.");
      if (id === actor.id && (!data.enabled || !data.canManageUsers))
        throw new HttpError(
          409,
          "No puedes desactivar tu cuenta ni retirar tu propio acceso administrativo.",
        );
      await preserveAdmin(client, target, data.enabled, data.canManageUsers);
      const fields: string[] = [];
      if (target.full_name !== data.fullName) fields.push("full_name");
      if (target.enabled !== data.enabled) fields.push("enabled");
      if (target.can_manage_users !== data.canManageUsers)
        fields.push("can_manage_users");
      if (!fields.length) return target;
      await client.query(
        "UPDATE users SET full_name=$2,enabled=$3,can_manage_users=$4,version=version+1 WHERE id=$1",
        [id, data.fullName, data.enabled, data.canManageUsers],
      );
      if (!data.enabled || target.can_manage_users !== data.canManageUsers)
        await client.query("DELETE FROM sessions WHERE user_id=$1", [id]);
      await event(client, actor.id, id, "updated", fields);
    }
    return (
      await client.query<ManagedUser>(
        `SELECT ${columns} FROM users WHERE id=$1`,
        [id],
      )
    ).rows[0];
  });
}
export async function userHistory(actor: User, id: string) {
  assertManager(actor);
  z.string().uuid().parse(id);
  return (
    await db.query(
      `SELECT e.id,e.action,e.changed_fields,e.origin,e.created_at,coalesce(u.full_name,u.username) AS actor_name FROM user_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.target_id=$1 ORDER BY e.created_at DESC,e.id DESC LIMIT 30`,
      [id],
    )
  ).rows;
}
// Explicit operations require access to the application's runtime; no username-based privileges.
export async function operateUser(
  username: string,
  operation: "disable" | "grant-admin" | "set-name" | "reset-password",
  name?: string,
) {
  const parsedName = operation === "set-name" ? fullName.parse(name) : null;
  const newHash =
    operation === "reset-password"
      ? await hashPassword(z.string().min(14).max(128).parse(name))
      : null;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(841028)");
    const target = (
      await client.query<ManagedUser>(
        `SELECT ${columns} FROM users WHERE username=$1 FOR UPDATE`,
        [username],
      )
    ).rows[0];
    if (!target) throw new Error("Account not found.");
    if (operation === "disable") {
      await preserveAdmin(client, target, false, target.can_manage_users);
      await client.query(
        "UPDATE users SET enabled=false,version=version+1 WHERE id=$1",
        [target.id],
      );
      await client.query("DELETE FROM sessions WHERE user_id=$1", [target.id]);
      await event(
        client,
        null,
        target.id,
        "disabled",
        ["enabled"],
        "operational",
      );
    } else if (operation === "grant-admin") {
      if (!target.enabled)
        throw new Error("Enable account before granting administration.");
      await client.query(
        "UPDATE users SET can_manage_users=true,version=version+1 WHERE id=$1",
        [target.id],
      );
      await event(
        client,
        null,
        target.id,
        "admin_granted",
        ["can_manage_users"],
        "operational",
      );
    } else if (operation === "reset-password") {
      await client.query(
        "UPDATE users SET password_hash=$2,version=version+1 WHERE id=$1",
        [target.id, newHash],
      );
      await client.query("DELETE FROM sessions WHERE user_id=$1", [target.id]);
      await event(
        client,
        null,
        target.id,
        "password_reset",
        ["password"],
        "operational",
      );
    } else {
      await client.query(
        "UPDATE users SET full_name=$2,version=version+1 WHERE id=$1",
        [target.id, parsedName],
      );
      await event(
        client,
        null,
        target.id,
        "name_updated",
        ["full_name"],
        "operational",
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
