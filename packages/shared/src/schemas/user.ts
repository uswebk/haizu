import { z } from "zod";

export const RoleSchema = z.enum(["admin", "site_admin", "general", "viewer"]);
// admin = 管理者, site_admin = 拠点管理者, general = 一般, viewer = その他
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: RoleSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// 招待
export const InvitationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  token: z.string(),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Invitation = z.infer<typeof InvitationSchema>;
