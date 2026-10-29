import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidad y condiciones de envío" };

export default function Privacy() {
  return (
    <article className="wrap page-space reading">
      <h1>Privacidad y condiciones de envío</h1>
      <p>
        El Observatorio de Violencia Política es una herramienta de monitoreo
        ciudadano de Fundación Oxlajuj N’oj, en el marco del Programa Paridad
        2026. Este aviso explica el tratamiento de los reportes y los límites
        del servicio.
      </p>

      <h2>Administración de la información</h2>
      <p>
        Fundación Oxlajuj N’oj administra la información del observatorio y,
        a través de su equipo autorizado, decide sobre el acceso a los reportes,
        su revisión, clasificación, seguimiento y publicación. También le
        corresponde atender las solicitudes relacionadas con los datos y
        determinar las medidas de corrección, conservación o retirada que
        procedan, conforme a la legislación aplicable y los derechos de las
        personas involucradas.
      </p>
      <p>
        Tecsify HumanLabs participa en el desarrollo tecnológico de la
        plataforma. Esta función no le atribuye decisiones editoriales ni
        autoridad para aprobar reportes, determinar su veracidad, autorizar
        publicaciones o resolver solicitudes sobre la información. Las
        decisiones del observatorio corresponden a la Fundación; el uso de
        proveedores tecnológicos no transfiere esas decisiones a dichos
        proveedores.
      </p>
      <h2>Responsabilidad de quien envía</h2>
      <p>
        Quien presenta un reporte es responsable de la información y los
        archivos que aporta. Debe describir los hechos de buena fe, distinguir
        lo observado de sus interpretaciones y no presentar como comprobado
        aquello que desconoce. Debe contar con una base legítima para compartir
        el material, respetando los derechos de las personas involucradas.
      </p>
      <p>
        No está permitido enviar información deliberadamente falsa, capturas
        manipuladas para engañar, amenazas, acoso, suplantaciones, archivos
        maliciosos ni contenido destinado a exponer datos personales o
        perjudicar ilegítimamente a terceros. El observatorio puede rechazar
        estos envíos o excluirlos de sus publicaciones.
      </p>

      <h2>Qué información recibimos</h2>
      <p>
        El formulario recoge una descripción, una captura obligatoria y,
        opcionalmente, una URL. No solicita nombre, correo ni teléfono. Antes
        de enviar, oculta nombres, contactos, documentos, ubicaciones precisas
        y otros datos que no sean necesarios, especialmente los de menores de
        edad. No aportes imágenes íntimas ni credenciales de acceso.
      </p>
      <p>
        Enviar sin cuenta no garantiza anonimato. Se aplican límites de envío
        y acceso; cuando existe un proxy confiable configurado, se utilizan
        identificadores técnicos derivados de la conexión para aplicar esos
        límites, sin añadir la dirección de conexión al reporte. Normalizar
        las imágenes retira metadatos, pero no oculta sus datos visibles.
      </p>

      <h2>Para qué se utiliza el reporte</h2>
      <p>
        La información se utiliza para documentar, organizar, analizar y dar
        seguimiento a situaciones dentro del alcance del observatorio. El
        original se conserva en el área privada del equipo autorizado. Enviar
        un reporte no garantiza su aceptación, publicación, respuesta ni un
        resultado determinado.
      </p>

      <h2>Análisis con inteligencia artificial</h2>
      <p>
        Con la autorización solicitada en el formulario, la descripción y la
        captura se transmiten a OpenAI, un proveedor externo, para generar
        sugerencias de clasificación, resúmenes y observaciones. Los datos
        visibles en la captura también se transmiten. La URL no se consulta
        ni se adjunta automáticamente. Se registra la autorización, su fecha y
        la versión del aviso aplicable al envío.
      </p>
      <p>
        La detección automática de posibles nombres no impide el análisis.
        Por eso debes revisar el texto y la imagen antes de enviarlos. La IA
        puede equivocarse: no verifica identidad, autenticidad ni veracidad,
        no determina responsabilidad y no aprueba publicaciones. El reporte
        se conserva aunque el análisis falle.
      </p>
      <p>
        Las solicitudes de análisis adicional o de borradores de alertas usan
        texto preparado por el equipo; no adjuntan automáticamente el original,
        la captura ni las notas privadas. La API se utiliza con la opción de
        no guardar la respuesta, lo que no equivale a una garantía de ausencia
        de registros técnicos por parte del proveedor. Su tratamiento también
        está sujeto a sus políticas y condiciones.
      </p>

      <h2>Publicaciones e imágenes</h2>
      <p>
        La recepción no hace público el original. El equipo puede preparar y
        aprobar una versión pública de título y texto. Para incluir una imagen,
        una revisora debe confirmar expresamente su revisión y autorización:
        puede aprobar una copia de la captura almacenada o subir una imagen
        distinta. La copia pública puede contener los mismos datos visibles
        que el original si se aprueba sin cambios. El consentimiento para el
        análisis con IA no constituye, por sí solo, autorización de publicación.
      </p>
      <p>
        Revisar o publicar un reporte no certifica que los hechos estén
        comprobados ni constituye una acusación o resolución judicial. Las
        personas que consultan publicaciones no deben utilizarlas para acosar,
        identificar indebidamente o perjudicar a terceros. Las imágenes públicas
        pueden descargarse o compartirse: retirar una imagen del sitio no
        elimina las copias que otras personas hayan guardado.
      </p>

      <h2>Límites del servicio y responsabilidades</h2>
      <p>
        Este sitio no recibe denuncias penales, no presta atención de emergencia
        y no sustituye asesoría jurídica ni investigaciones de las autoridades.
        No garantiza disponibilidad ininterrumpida, ausencia de errores ni
        resultados de acciones realizadas por terceros a partir de un reporte.
      </p>
      <p>
        El envío de contenido por una persona no implica que la Fundación o el
        equipo desarrollador adopten sus afirmaciones. Quien aporta información
        responde por su propia conducta; el observatorio y los proveedores
        responden por las actuaciones que les correspondan conforme a la
        legislación aplicable. Estas condiciones no excluyen obligaciones
        legales de protección de datos ni responsabilidades que no puedan
        limitarse por acuerdo, y no suponen una renuncia a derechos.
      </p>
      <h2>Contacto y solicitudes sobre tus datos</h2>
      <p>
        Para consultar sobre el tratamiento de datos, solicitar una corrección
        o pedir la retirada de contenido, escribe a{" "}
        <a href="mailto:programaparidadoxlajujnoj@gmail.com">
          programaparidadoxlajujnoj@gmail.com
        </a>
        . Indica la referencia o el enlace del reporte, si lo tienes, y describe
        tu solicitud. Evita adjuntar documentos de identidad o información
        sensible que no sea necesaria.
      </p>
    </article>
  );
}
