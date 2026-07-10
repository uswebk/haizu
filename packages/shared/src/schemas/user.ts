import { z } from "zod";

export const ORG_ROLES = ["admin", "member"] as const;
export const SITE_ROLES = ["site_admin", "general", "viewer"] as const;

export const OrgRoleSchema = z.enum(ORG_ROLES);
export const SiteRoleSchema = z.enum(SITE_ROLES);

export type OrgRole = (typeof ORG_ROLES)[number];
export type SiteRole = (typeof SITE_ROLES)[number];

export const UserSchema = z.object({
	id: z.string().uuid(),
	organizationId: z.string().uuid(),
	name: z.string().min(1),
	email: z.string().email(),
	role: OrgRoleSchema,
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
	role: OrgRoleSchema,
	token: z.string(),
	expiresAt: z.string().datetime(),
	acceptedAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const SignUpInputSchema = z.object({
	name: z.string().min(1),
	companyName: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8),
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export const LoginInputSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
