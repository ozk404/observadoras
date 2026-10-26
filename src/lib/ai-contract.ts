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
export const assessmentLabels = {
  relevant: "Parece pertinente al observatorio",
  needs_context: "Requiere más contexto",
  out_of_scope: "Parece fuera de alcance",
  possible_spam: "Presenta señales de posible spam",
} as const;
export const intakeSuggestionSchema = suggestionSchema
  .extend({
    assessment: z.enum([
      "relevant",
      "needs_context",
      "out_of_scope",
      "possible_spam",
    ]),
    assessmentReason: z.string().trim().min(10).max(1000),
    evidenceNotes: z.string().trim().min(10).max(1200),
    observations: z.array(z.string().trim().min(5).max(500)).min(1).max(5),
    missingInformation: z.array(z.string().trim().min(5).max(400)).max(5),
  })
  .strict();
export type IntakeSuggestion = z.infer<typeof intakeSuggestionSchema>;
export const intakeStateLabels = {
  queued: "Análisis en cola",
  processing: "Analizando descripción y captura",
  completed: "Análisis preliminar disponible",
  failed: "No se pudo completar el análisis",
  blocked: "Análisis detenido",
  superseded: "Análisis no vigente",
} as const;
export const intakeErrorLabels: Record<string, string> = {
  configuration:
    "OpenAI no está configurado o el análisis automático está desactivado.",
  privacy:
    "El envío requiere revisión de privacidad antes de procesarse. No se envió a OpenAI.",
  quota: "Se alcanzó el límite de análisis. Puedes continuar manualmente.",
  stale:
    "El registro cambió o su revisión terminó; no se utilizará este resultado.",
  unavailable:
    "OpenAI no estuvo disponible. El reporte se conserva para revisión manual.",
  timeout: "Se agotó el tiempo de espera. Puedes continuar manualmente.",
  invalid_response:
    "La respuesta no cumplió el formato o las reglas de privacidad.",
  refused: "El proveedor no pudo procesar este contenido.",
};
export type IntakeView = {
  id: string;
  report_version: number;
  state: keyof typeof intakeStateLabels;
  attempts: number;
  result: IntakeSuggestion | null;
  error_code: string | null;
  model: string | null;
  transport: "openai" | "simulation" | null;
  created_at: string;
  finished_at: string | null;
};
export const aiInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(20, "Prepara un texto de al menos 20 caracteres.")
      .max(6000),
    privacyConfirmed: z.literal(true),

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
