"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function TeamNavigation({
  inHeader = false,
  reviewer = true,
  canManageUsers = false,
}: {
  inHeader?: boolean;
  reviewer?: boolean;
  canManageUsers?: boolean;
}) {
  const path = usePathname();
  if (!inHeader && (path === "/equipo" || path === "/equipo/usuarios"))
    return null;
  return (
    <nav className="private-nav" aria-label="Área de revisión">
      <Link
        href="/equipo"
        aria-current={
          path === "/equipo"
            ? "page"
            : !path.startsWith("/equipo/dashboard") &&
                !path.startsWith("/equipo/usuarios")
              ? "location"
              : undefined
        }
      >
        Reportes
      </Link>
      {reviewer && (
        <Link
          href="/equipo/dashboard"
          aria-current={path === "/equipo/dashboard" ? "page" : undefined}
        >
          Resumen
        </Link>
      )}
      {canManageUsers && (
        <Link
          href="/equipo/usuarios"
          aria-current={
            path.startsWith("/equipo/usuarios") ? "page" : undefined
          }
        >
          Usuarios
        </Link>
      )}
    </nav>
  );
}
