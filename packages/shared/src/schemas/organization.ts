import { z } from "zod";

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationUpdateInputSchema = z.object({
  name: z.string().min(1),
});

export type OrganizationUpdateInput = z.infer<
  typeof OrganizationUpdateInputSchema
>;
