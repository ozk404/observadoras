import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap page-space empty-state">
      <span className="eyebrow">Página no disponible</span>
      <h1>No encontramos este contenido.</h1>
      <p>Puede que no exista o que no esté disponible para tu cuenta.</p>
      <Link className="button" href="/">
        Volver al inicio
      </Link>
    </div>
  );
}
