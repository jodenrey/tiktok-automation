import { z } from "zod";

export const cronSchema = z
  .string()
  .min(5)
  .refine(
    (v) => v.trim().split(/\s+/).length === 5,
    "Cron must have 5 fields (e.g. '0 9 * * *')",
  );

export const scheduleEntrySchema = z.object({
  cron: cronSchema,
});

export const automationInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  niche: z.string().max(120).optional().or(z.literal("")),
  language: z.string().max(40).default("English"),
  numOfSlides: z.number().int().min(1).max(20),
  hooks: z.array(z.string().min(1)).min(1, "Add at least one hook"),
  stylePrompt: z.string().min(1).max(8000),
  imageSource: z.enum(["pinterest", "unsplash", "collection"]),
  collectionId: z.string().nullable().optional(),
  tiktokAccountId: z.string().nullable().optional(),
  autoPost: z.boolean().default(true),
  postMode: z.enum(["DIRECT_POST", "MEDIA_UPLOAD"]).default("DIRECT_POST"),
  visibility: z.string().default("PUBLIC_TO_EVERYONE"),
  captionMode: z.enum(["prompt", "static"]).default("prompt"),
  captionPrompt: z.string().default(""),
  captionStatic: z.string().optional(),
  schedules: z.array(scheduleEntrySchema).min(1, "Add at least one schedule"),
});

export type AutomationInput = z.infer<typeof automationInputSchema>;

export const automationPatchSchema = z.union([
  automationInputSchema.partial(),
  z.object({ action: z.enum(["pause", "unpause"]) }),
]);
