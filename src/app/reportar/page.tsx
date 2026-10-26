import type { Metadata } from "next";
import { PublicForm } from "@/components/public-form";
import { Shield } from "@/components/icons";
export const metadata: Metadata = { title: "Enviar reporte" };
export default function Reportar() {
  return (
    <div className="wrap page-space">
      <div className="page-heading">
        <span className="eyebrow">Un espacio para tu relato</span>
        <h1>Enviar un reporte</h1>
        <p>
          Comparte una situación de violencia política digital, desinformación o
          una barrera a la participación política de las mujeres.
        </p>
      </div>
      <div className="form-layout">
        <section className="form-panel">
          <PublicForm />
        </section>
        <aside className="care-aside">
          <Shield />
          <h2>
            El cuidado empieza
            <br />
            con la información.
          </h2>
          <p>
            Tu relato original será privado y lo recibirá el equipo autorizado
            del observatorio.
          </p>
          <ul>
            <li>No solicitamos tu nombre ni datos de contacto.</li>
            <li>
              La captura y la URL se consultan únicamente en el área privada.
              Oculta datos personales innecesarios antes de adjuntar la imagen.
            </li>
            <li>
              Evita identificar a víctimas, participantes o terceras personas.
            </li>
            <li>
              Solo se publicará una versión revisada y aprobada por una persona
              autorizada.
            </li>
          </ul>
          <div className="aside-note">
            Este envío informa al observatorio; no presenta una denuncia penal
            ni es un servicio de emergencia.
          </div>
        </aside>
      </div>
    </div>
  );
}
