import Link from "next/link";
import { notFound } from "next/navigation";
import { publication } from "@/server/reports";
export const dynamic = "force-dynamic";
export default async function PublicDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const row = await publication((await params).id);
  if (!row) notFound();
  return (
    <article className="wrap page-space reading">
      <Link className="back-link" href="/denuncias">
        ← Volver al catálogo
      </Link>
      <span className="eyebrow">Versión pública · Revisión humana</span>
      <h1>{row.title}</h1>
      <p className="help">
        Publicado el{" "}
        {new Intl.DateTimeFormat("es-GT", {
          dateStyle: "long",
          timeZone: "America/Guatemala",
        }).format(row.published_at)}
      </p>
      <div className="report-body">{row.body}</div>
      <aside className="notice">
        Este texto es una versión preparada y aprobada para publicación por el
        equipo. No constituye una determinación judicial.
      </aside>
    </article>
  );
}
