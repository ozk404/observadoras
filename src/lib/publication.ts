export const publicationSections = [
  { key: "summary", label: "Resumen público", heading: "Resumen", max: 800 },
  { key: "context", label: "Contexto público", heading: "Contexto", max: 1800 },
  {
    key: "findings",
    label: "Hallazgos públicos",
    heading: "Hallazgos",
    max: 1800,
  },
  {
    key: "analysis",
    label: "Análisis público del observatorio",
    heading: "Análisis del observatorio",
    max: 1800,
  },
  {
    key: "limitations",
    label: "Límites del análisis público",
    heading: "Límites del análisis",
    max: 1000,
  },
] as const;
