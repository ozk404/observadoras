import { requireUser } from "@/server/auth";
import { listUsers } from "@/server/users";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserManagement } from "@/components/user-management";
import styles from "./users.module.css";
export const metadata = { title: "Usuarios" };
export default async function Users({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireUser();
  if (!actor.can_manage_users) notFound();
  const params = await searchParams;
  const search =
    typeof params.buscar === "string" ? params.buscar.slice(0, 100) : "";
  const page = Math.min(
    10000,
    Math.max(
      1,
      parseInt(typeof params.pagina === "string" ? params.pagina : "1") || 1,
    ),
  );
  const rows = await listUsers(actor, page, search);
  const address = (value: number) =>
    `/equipo/usuarios?${new URLSearchParams({ buscar: search, pagina: String(value) })}`;
  return (
    <div className={styles.page}>
      <UserManagement
        users={rows.slice(0, 20)}
        actorId={actor.id}
        reviewer={actor.role === "reviewer"}
        search={search}
      />
      {(page > 1 || rows.length > 20) && (
        <nav className={styles.pagination} aria-label="Paginación de usuarios">
          {page > 1 ? (
            <Link href={address(page - 1)}>← Anterior</Link>
          ) : (
            <span />
          )}
          <span>Página {page}</span>
          {rows.length > 20 && (
            <Link href={address(page + 1)}>Siguiente →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
