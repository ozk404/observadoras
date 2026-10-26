export default function Privacy() {
  return (
    <article className="wrap page-space reading">
      <span className="eyebrow">Información antes de enviar</span>
      <h1>
        Privacidad y cuidado
        <br />
        de la información
      </h1>
      <p>
        Observadoras Digitales es una herramienta de monitoreo ciudadano para
        Fundación Oxlajuj No’j.
      </p>
      <h2>Qué recoge este formulario</h2>
      <p>
        Una descripción y una captura o imagen obligatoria; puedes
        añadir una URL opcional. No solicita nombre, correo ni teléfono. Oculta
        datos personales innecesarios en el texto y la captura antes de
        enviarlos. Enviar sin cuenta no garantiza anonimato frente a tu conexión
        o proveedor de Internet.
      </p>
      <h2>Quién puede leerlo</h2>
      <p>
        El original queda en el área privada del equipo autorizado. Una persona
        revisora puede preparar un título y texto diferentes para publicación,
        revisar el riesgo de identificación y aprobarlos expresamente. El
        original no se publica automáticamente. La imagen y la URL se conservan
        como material privado para revisión, incluso si se publica una versión
        textual. La URL no se adjunta a solicitudes de IA. Las imágenes se
        normalizan para retirar metadatos, lo que no elimina datos visibles
        dentro de la captura ni garantiza anonimato.
      </p>
      <h2>Qué ocurre con la IA</h2>
      <p>
        Al enviar un reporte, autorizas el análisis automático de la descripción
        y la captura mediante OpenAI, un proveedor externo. Se registra tu
        aceptación, su fecha y la versión de este aviso. Se aplican controles
        previos sobre el texto; la URL no se consulta ni se adjunta
        automáticamente. Los datos visibles en una imagen también se transmiten:
        oculta los que no sean necesarios antes de enviarla. El análisis sugiere categorías, pertinencia
        y observaciones para revisión humana; no demuestra que los hechos sean
        verdaderos ni que la captura sea auténtica. El envío se conserva si la
        IA falla. Las revisoras también pueden solicitar propuestas de alerta
        con texto preparado y revisado; esas solicitudes no adjuntan
        automáticamente el original, la captura ni las notas de seguimiento.
        Las solicitudes a la API usan la opción de no guardar la respuesta;
        esto no garantiza que el proveedor no conserve registros técnicos
        conforme a sus políticas.
      </p>
      <h2>Protección frente a abuso</h2>
      <p>
        Se limitan los intentos de envío y acceso. Cuando el entorno tiene un
        proxy confiable configurado, se utilizan identificadores técnicos
        derivados de la dirección de conexión para aplicar límites, sin guardar
        esa dirección en el reporte.
      </p>
      <h2>Alcance del envío</h2>
      <p>
        El reporte informa al observatorio. No presenta una denuncia penal ni
        activa una atención de emergencia. La revisión y cualquier publicación
        requieren una decisión humana.
      </p>
    </article>
  );
}
