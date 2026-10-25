"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="wrap page-space empty-state">
      <h1>No pudimos cargar esta página.</h1>
      <p>Inténtalo de nuevo en unos momentos.</p>
      <button className="button" onClick={reset}>
        Volver a intentar
      </button>
    </div>
  );
}
