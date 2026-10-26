import { z } from "zod";
export const alertSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("initial"), id: z.uuid() }).strict(),
  z.object({ kind: z.literal("prepared"), id: z.uuid() }).strict(),
  z.object({ kind: z.literal("generated"), id: z.uuid() }).strict(),
]);
export type AlertSource = z.infer<typeof alertSourceSchema>;
export const alertDraftInput = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Escribe al menos 5 caracteres.")
      .max(160, "Usa hasta 160 caracteres."),
    body: z
      .string()
      .trim()
      .min(20, "Escribe al menos 20 caracteres.")
      .max(6000, "Usa hasta 6000 caracteres."),
    reportVersion: z.number().int().positive(),
    draftVersion: z.number().int().nonnegative(),
    source: alertSourceSchema.nullable().default(null),
  })
  .strict();
export type AlertDraft = {
  id: string;
  title: string;
  body: string;
  version: number;
  creator_username: string;
  editor_username: string;
  created_at: string;
  updated_at: string;
  source: AlertSource | null;
};
export type AlertBase = { source: AlertSource; summary: string };
export type AlertContext = {
  draft: AlertDraft | null;
  base: AlertBase | null;
  generation: AlertGenerationView | null;
};
export const alertSuggestionSchema = z
  .object({
    title: z.string().trim().min(5).max(160),
    body: z.string().trim().min(20).max(6000),
    limitations: z.string().trim().min(10).max(1000),
  })
  .strict();
export type AlertSuggestion = z.infer<typeof alertSuggestionSchema>;
export const alertGenerationInput = z
  .object({
    text: z.string().trim().min(20).max(6000),
    privacyConfirmed: z.literal(true),

    reportVersion: z.number().int().positive(),
    draftVersion: z.number().int().nonnegative(),
  })
  .strict();
export type AlertGenerationView = {
  id: string;
  report_version: number;
  draft_version: number;
  model: string;
  transport: "openai" | "simulation";
  status: "running" | "succeeded" | "failed";
  result: AlertSuggestion | null;
  error_code: string | null;
  created_at: string;
  finished_at: string | null;
};
