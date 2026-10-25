type Rule = { label: string; pattern: RegExp; replacement: string };
function rules(): Rule[] {
  return [
    {
      label: "correo electrónico",
      pattern: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,
      replacement: "[correo omitido]",
    },
    {
      label: "enlace o dominio identificable",
      pattern:
        /\b(?:https?:\/\/|www\.)[^\s]+|\b[\w-]+\.(?:com|org|net|gt|edu|io)\b[^\s]*/gi,
      replacement: "[enlace omitido]",
    },
    {
      label: "usuario de red",
      pattern: /@[\p{L}\d_.-]+/gu,
      replacement: "[usuario omitido]",
    },
    {
      label: "teléfono, fecha precisa o identificador numérico",
      pattern: /(?:\+?\d[\d(). -]{6,}\d)/g,
      replacement: "[identificador omitido]",
    },
    {
      label: "posible nombre de persona",
      pattern:
        /\b(?:mi nombre es|se llama|nombre completo\s*:|persona afectada\s*:)\s*[^\n.,;]+/gi,
      replacement: "[referencia personal omitida]",
    },
    {
      label: "posible nombre compuesto",
      pattern:
        /(?<![\p{L}])[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}(?![\p{L}])/gu,
      replacement: "[nombre o referencia omitida]",
    },
  ];
}
export function sensitiveSignals(text: string) {
  return rules()
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);
}
export function redactCommonIdentifiers(text: string) {
  return rules().reduce(
    (value, rule) => value.replace(rule.pattern, rule.replacement),
    text,
  );
}
