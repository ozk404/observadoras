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

export type PublicationCopy = {
  title: string;
  body: string;
  categories: string[];
  summary: string;
  context: string;
  findings: string;
  analysis: string;
  limitations: string;
};
export type ManagedPublication = PublicationCopy & {
  id: string;
  version: number;
  published_at: string;
  updated_at: string;
  withdrawn_at: string | null;
};
export type PublicationContext = {
  publication: ManagedPublication;
  events: {
    id: string;
    action: string;
    version: number;
    reason: string;
    actor_name: string;
    created_at: string;
  }[];
  image: {
    image_version: number;
    asset_id: string | null;
    description: string | null;
  };
};
