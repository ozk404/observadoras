import { z } from "zod";
const fields = {
  note: z
    .string()
    .trim()
    .min(10, "Escribe al menos 10 caracteres.")
    .max(2000, "Usa hasta 2000 caracteres."),
  version: z.number().int().positive(),
};
export const followupInput = z.discriminatedUnion("action", [
  z.object({ ...fields, action: z.literal("note") }).strict(),
  z
    .object({
      ...fields,
      action: z.literal("close"),
      confirmed: z.literal(true),
    })
    .strict(),
]);
export type FollowupEntry = {
  id: string;
  kind: "note" | "closed";
  note: string;
  reviewer_username: string;
  created_at: string;
};
