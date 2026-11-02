import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://observadoras.tecsify.com"),
  title: {
    default: "Observatorio de Violencia Política · Fundación Oxlajuj N’oj",
    template: "%s · Observatorio de Violencia Política",
  },
  description:
    "Monitoreo ciudadano de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala. Programa Paridad 2026.",
  icons: {
    icon: [{ url: "/illustrations/favic.jpg", type: "image/jpeg", sizes: "32x32" }],
    shortcut: "/illustrations/favic.jpg",
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    siteName: "Observatorio de Violencia Política",
    title: "Observatorio de Violencia Política · Fundación Oxlajuj N’oj",
    description: "Monitoreo ciudadano de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala. Programa Paridad 2026.",
    images: [{ url: "/illustrations/metaimg.jpg", width: 1200, height: 630, alt: "Observatorio de Violencia Política · Programa Paridad 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Observatorio de Violencia Política · Fundación Oxlajuj N’oj",
    description: "Monitoreo ciudadano de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala. Programa Paridad 2026.",
    images: ["/illustrations/metaimg.jpg"],
  },
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
