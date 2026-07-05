import { z } from "zod";

export const SiteSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  iconBg: z.string(),
  iconColor: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Site = z.infer<typeof SiteSchema>;

export const SiteInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).default(""),
  isActive: z.boolean().default(true),
});

export type SiteInput = z.infer<typeof SiteInputSchema>;
