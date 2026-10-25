export function Status({
  status,
}: {
  status: "draft" | "pending" | "needs_adjustments" | "validated" | "published";
}) {
  return (
    <span className={`status ${status}`}>
      {
        {
          draft: "Borrador privado",
          pending: "Pendiente de revisión",
          needs_adjustments: "Requiere ajustes",
          validated: "Validado internamente",
          published: "Versión pública aprobada",
        }[status]
      }
    </span>
  );
}
