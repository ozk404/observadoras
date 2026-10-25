import { z } from "zod";
// These are examples in the working specification, not an approved institutional taxonomy.
export const categoryLabels = {
  acoso: "Acoso",
  amenaza: "Amenaza",
  desinformacion: "Desinformación",
  odio: "Discurso de odio",
  desprestigio: "Desprestigio",
  doxing: "Doxing",
  suplantacion: "Suplantación",
  manipulacion: "Manipulación electoral",
  violencia_politica: "Violencia política digital",
  barrera: "Barrera a la participación",
  sin_clasificar: "Sin clasificación suficiente",
} as const;
export const categoryKeys = Object.keys(categoryLabels) as [
  keyof typeof categoryLabels,
  ...(keyof typeof categoryLabels)[],
];
export const suggestionSchema = z
  .object({
    categories: z.array(z.enum(categoryKeys)).min(1).max(4),
    summary: z.string().trim().min(20).max(2400),
    limitations: z.string().trim().min(10).max(1000),
  })
  .strict();
export type Suggestion = z.infer<typeof suggestionSchema>;
export const aiInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(20, "Prepara un texto de al menos 20 caracteres.")
      .max(6000),
    privacyConfirmed: z.literal(true),
    syntheticConfirmed: z.literal(true),
    version: z.number().int().positive(),
  })
  .strict();
export type AnalysisView = {
  superseded_at: string | null;
  id: string;
  model: string;
  transport: "openai" | "simulation";
  status: "running" | "succeeded" | "failed";
  result: Suggestion | null;
  error_code: string | null;
  created_at: string;
};
export const analysisErrorLabels: Record<string, string> = {
  unavailable: "El servicio no está disponible. Puedes continuar manualmente.",
  timeout: "La solicitud excedió el tiempo de espera. Tu registro se conserva.",
  invalid_response:
    "No se recibió una sugerencia válida. Puedes continuar manualmente.",
  refused:
    "El proveedor no pudo procesar este contenido. Continúa con revisión manual.",
  stale:
    "El registro cambió o el acceso fue revocado. El resultado fue descartado.",
};
