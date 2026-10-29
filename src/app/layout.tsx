import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Observatorio de Violencia Política · Fundación Oxlajuj No’j",
    template: "%s · Observatorio de Violencia Política",
  },
  description:
    "Un espacio para documentar y visibilizar las barreras a la participación política de las mujeres.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="wordmark">
              <span>
                Observatorio<span className="brand-dot">.</span>
              </span>
              <small>DE VIOLENCIA POLÍTICA</small>
            </Link>
            <nav aria-label="Navegación principal">
              <Link href="/reportes">Ver reportes</Link>
              <Link href="/reportar" className="nav-primary">
                Enviar reporte
              </Link>
              <Link href="/ingreso" className="team-link">
                Acceso del equipo ↗
              </Link>
              <span id="header-account-slot" />
            </nav>
          </div>
        </header>
        <main id="contenido">{children}</main>
        <footer className="site-footer">
          <div>
            <strong>Fundación Oxlajuj No’j</strong>
            <span>
              Observatorio de Violencia Política · Programa Paridad 2026
            </span>
          </div>
          <div>
            <Link href="/privacidad">
              Privacidad y cuidado de la información
            </Link>
          </div>
          <p className="site-credits">Hecho con mucho 💙 desde Guatemala por <a href="https://tecsify.com" target="_blank" rel="noopener noreferrer">Tecsify HumanLabs</a></p>
        </footer>
      </body>
    </html>
  );
}
