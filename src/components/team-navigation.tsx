"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function TeamNavigation() {
  const path = usePathname();
  return (
    <nav className="private-nav" aria-label="Área de revisión">
      <Link
        href="/equipo"
        aria-current={
          path === "/equipo"
            ? "page"
            : !path.startsWith("/equipo/dashboard")
              ? "location"
              : undefined
        }
      >
        Reportes
      </Link>
      <Link
        href="/equipo/dashboard"
        aria-current={path === "/equipo/dashboard" ? "page" : undefined}
      >
        Resumen
      </Link>
    </nav>
  );
}
