import { randomUUID } from "node:crypto";
import {
	type OrgRole,
	OrgRoleSchema,
	type SiteRole,
	SiteRoleSchema,
} from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import {
	invitationSites,
	invitations,
	memberSites,
	sites,
	user,
} from "../db/schema";
import { emailSender } from "../email";
import { WEB_ORIGIN } from "../lib/env";
import {
	assertSitesManageable,
	evaluateOrgRoleAssignment,
} from "../lib/member-role-policy";
import { requireAuth } from "../middleware/auth";
import { requireSitePermission } from "../middleware/require-permission";
import { siteScope } from "../middleware/site-scope";
import type { AppEnv } from "../types";

const INVITE_TTL_DAYS = 7;

const siteRoleInput = z.object({
	siteId: z.string().uuid(),
	role: SiteRoleSchema,
});

// Invariant: a member always belongs to at least one site (admins have all-site access, so they hold no assignments).
// Breaking this would create a user who can't enter any screen.
const NO_SITE_MESSAGE = "Select at least one assigned site";

const inviteInput = z
	.object({
		lastName: z.string().min(1),
		firstName: z.string(),
		email: z.string().email(),
		orgRole: OrgRoleSchema,
		siteRoles: z.array(siteRoleInput),
	})
	.refine((v) => v.orgRole === "admin" || v.siteRoles.length > 0, {
		path: ["siteRoles"],
		message: NO_SITE_MESSAGE,
	});

const updateInput = z.object({
	orgRole: OrgRoleSchema,
	siteRoles: z.array(siteRoleInput),
	isActive: z.boolean(),
});

type SiteRoleAssignment = { siteId: string; role: SiteRole };

type MemberResponse = {
	id: string;
	kind: "user" | "invitation";
	name: string;
	email: string;
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
	// Admins can access all sites, so they have no siteRoles
	allSites: boolean;
	status: "active" | "inactive" | "invited";
};

// Sites where the operator can set site roles. Admins get all sites in the org
async function manageableSiteIds(
	organizationId: string,
	actor: { id: string; role: OrgRole },
): Promise<string[]> {
	if (actor.role === "admin") {
		const rows = await db
			.select({ id: sites.id })
			.from(sites)
			.where(eq(sites.organizationId, organizationId));
		return rows.map((r) => r.id);
	}
	const rows = await db
		.select({ siteId: memberSites.siteId })
		.from(memberSites)
		.where(
			and(eq(memberSites.userId, actor.id), eq(memberSites.role, "site_admin")),
		);
	return rows.map((r) => r.siteId);
}

// Verify all given site ids belong to the organization (prevents mixing in other orgs' sites)
async function assertSitesInOrg(organizationId: string, siteIds: string[]) {
	if (siteIds.length === 0) return true;
	const rows = await db
		.select({ id: sites.id })
		.from(sites)
		.where(
			and(eq(sites.organizationId, organizationId), inArray(sites.id, siteIds)),
		);
	return rows.length === siteIds.length;
}

// Member management is done only by the "current site's site admin" (admins count as site admins at every site).
// The list includes other members' email addresses too, so restrict viewing as well.
export const membersRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", siteScope)
	.use("*", requireSitePermission("member:manage"))

	.get("/", async (c) => {
		const organizationId = c.get("organizationId");
		const actor = c.get("user");
		const manageable = await manageableSiteIds(organizationId, actor);
		const visible = new Set(manageable);

		const users = await db
			.select()
			.from(user)
			.where(eq(user.organizationId, organizationId))
			.orderBy(user.createdAt);

		const pending = await db
			.select()
			.from(invitations)
			.where(eq(invitations.organizationId, organizationId))
			.orderBy(invitations.createdAt);

		const userSiteLinks = users.length
			? await db
					.select()
					.from(memberSites)
					.where(
						inArray(
							memberSites.userId,
							users.map((u) => u.id),
						),
					)
			: [];
		const invitationSiteLinks = pending.length
			? await db
					.select()
					.from(invitationSites)
					.where(
						inArray(
							invitationSites.invitationId,
							pending.map((i) => i.id),
						),
					)
			: [];

		// Show a site admin only the assignments for the sites they manage
		const scopeSiteRoles = (rows: SiteRoleAssignment[]) =>
			actor.role === "admin" ? rows : rows.filter((r) => visible.has(r.siteId));
		// Show a site admin only the members belonging to the sites they manage.
		// Admins don't belong to sites, and a site admin can't change an admin's permissions, so admins aren't listed either.
		const isVisibleMember = (m: MemberResponse) =>
			actor.role === "admin" || m.siteRoles.length > 0;

		const members: MemberResponse[] = [
			...users
				.map<MemberResponse>((u) => ({
					id: u.id,
					kind: "user",
					name: u.name,
					email: u.email,
					orgRole: u.role,
					siteRoles: scopeSiteRoles(
						userSiteLinks
							.filter((l) => l.userId === u.id)
							.map((l) => ({ siteId: l.siteId, role: l.role })),
					),
					allSites: u.role === "admin",
					status: u.isActive ? "active" : "inactive",
				}))
				.filter(isVisibleMember),
			...pending
				.filter((i) => i.acceptedAt === null)
				.map<MemberResponse>((i) => ({
					id: i.id,
					kind: "invitation",
					name: `${i.lastName} ${i.firstName}`.trim(),
					email: i.email,
					orgRole: i.role,
					siteRoles: scopeSiteRoles(
						invitationSiteLinks
							.filter((l) => l.invitationId === i.id)
							.map((l) => ({ siteId: l.siteId, role: l.role })),
					),
					allSites: i.role === "admin",
					status: "invited",
				}))
				.filter(isVisibleMember),
		];

		return c.json({ members });
	})

	.post("/invite", zValidator("json", inviteInput), async (c) => {
		const organizationId = c.get("organizationId");
		const actor = c.get("user");
		const input = c.req.valid("json");

		// Prevent privilege escalation via invitations. Apply the same rules as PUT /:id.
		const orgAssignment = evaluateOrgRoleAssignment({
			actorOrgRole: actor.role,
			isSelf: false,
			targetOrgRole: null,
			nextOrgRole: input.orgRole,
		});
		if (!orgAssignment.ok) {
			return c.json({ error: orgAssignment.message }, orgAssignment.status);
		}

		// Admins can access all sites, so don't give them per-site assignments
		const siteRoles = input.orgRole === "admin" ? [] : input.siteRoles;
		const siteIds = siteRoles.map((s) => s.siteId);

		if (!(await assertSitesInOrg(organizationId, siteIds))) {
			return c.json(
				{ error: "Includes a site that doesn't exist in this organization" },
				400,
			);
		}
		const manageable = await manageableSiteIds(organizationId, actor);
		const scopeCheck = assertSitesManageable(manageable, siteIds);
		if (!scopeCheck.ok) {
			return c.json({ error: scopeCheck.message }, scopeCheck.status);
		}

		// Reject emails already registered as a member / pending an invitation in the same organization
		const existingUser = await db.query.user.findFirst({
			where: and(
				eq(user.organizationId, organizationId),
				eq(user.email, input.email),
			),
		});
		if (existingUser) {
			return c.json({ error: "This email address is already a member" }, 400);
		}
		const existingInvite = await db.query.invitations.findFirst({
			where: and(
				eq(invitations.organizationId, organizationId),
				eq(invitations.email, input.email),
			),
		});
		if (existingInvite && existingInvite.acceptedAt === null) {
			return c.json(
				{ error: "This email address has already been invited" },
				400,
			);
		}

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

		const invitation = await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(invitations)
				.values({
					organizationId,
					lastName: input.lastName,
					firstName: input.firstName,
					email: input.email,
					role: input.orgRole,
					token: randomUUID(),
					expiresAt,
				})
				.returning();
			const row = inserted[0];
			if (!row) throw new Error("Insert failed");
			if (siteRoles.length > 0) {
				await tx.insert(invitationSites).values(
					siteRoles.map((s) => ({
						invitationId: row.id,
						siteId: s.siteId,
						role: s.role,
					})),
				);
			}
			return row;
		});

		const acceptUrl = `${WEB_ORIGIN}/invite-accept?token=${invitation.token}`;
		await emailSender.send({
			to: invitation.email,
			subject: "Member invitation",
			body: acceptUrl,
		});

		const member: MemberResponse = {
			id: invitation.id,
			kind: "invitation",
			name: `${invitation.lastName} ${invitation.firstName}`.trim(),
			email: invitation.email,
			orgRole: invitation.role,
			siteRoles,
			allSites: invitation.role === "admin",
			status: "invited",
		};
		return c.json(member, 201);
	})

	.put("/:id", zValidator("json", updateInput), async (c) => {
		const { id } = c.req.param();
		const organizationId = c.get("organizationId");
		const actor = c.get("user");
		const input = c.req.valid("json");

		const target = await db.query.user.findFirst({
			where: and(eq(user.id, id), eq(user.organizationId, organizationId)),
		});
		if (!target) return c.json({ error: "Not found" }, 404);

		const orgAssignment = evaluateOrgRoleAssignment({
			actorOrgRole: actor.role,
			isSelf: actor.id === target.id,
			targetOrgRole: target.role,
			nextOrgRole: input.orgRole,
		});
		if (!orgAssignment.ok) {
			return c.json({ error: orgAssignment.message }, orgAssignment.status);
		}

		const siteRoles = input.orgRole === "admin" ? [] : input.siteRoles;
		const siteIds = siteRoles.map((s) => s.siteId);
		if (!(await assertSitesInOrg(organizationId, siteIds))) {
			return c.json(
				{ error: "Includes a site that doesn't exist in this organization" },
				400,
			);
		}

		const manageable = await manageableSiteIds(organizationId, actor);
		const scopeCheck = assertSitesManageable(manageable, siteIds);
		if (!scopeCheck.ok) {
			return c.json({ error: scopeCheck.message }, scopeCheck.status);
		}

		// A site admin only replaces their managed sites, so count memberships remaining outside their control too.
		if (input.orgRole === "member") {
			const manageableSet = new Set(manageable);
			const existing = await db
				.select({ siteId: memberSites.siteId })
				.from(memberSites)
				.where(eq(memberSites.userId, id));
			const preserved = existing.filter((r) => !manageableSet.has(r.siteId));
			if (preserved.length + siteRoles.length === 0) {
				return c.json({ error: NO_SITE_MESSAGE }, 400);
			}
		}

		await db.transaction(async (tx) => {
			await tx
				.update(user)
				.set({
					role: input.orgRole,
					isActive: input.isActive,
					updatedAt: new Date(),
				})
				.where(eq(user.id, id));

			if (input.orgRole === "admin") {
				// Admins have all-site access, so they hold no site assignments
				await tx.delete(memberSites).where(eq(memberSites.userId, id));
				return;
			}

			// A site admin can't see assignments for sites outside their control. Deleting them all
			// would wipe other sites' assignments, so replace only the rows for sites they can manage.
			if (manageable.length > 0) {
				await tx
					.delete(memberSites)
					.where(
						and(
							eq(memberSites.userId, id),
							inArray(memberSites.siteId, manageable),
						),
					);
			}
			if (siteRoles.length > 0) {
				await tx.insert(memberSites).values(
					siteRoles.map((s) => ({
						userId: id,
						siteId: s.siteId,
						role: s.role,
					})),
				);
			}
		});

		const member: MemberResponse = {
			id: target.id,
			kind: "user",
			name: target.name,
			email: target.email,
			orgRole: input.orgRole,
			siteRoles,
			allSites: input.orgRole === "admin",
			status: input.isActive ? "active" : "inactive",
		};
		return c.json(member);
	})

	.delete("/invitations/:id", async (c) => {
		const { id } = c.req.param();
		const organizationId = c.get("organizationId");

		const deleted = await db
			.delete(invitations)
			.where(
				and(
					eq(invitations.id, id),
					eq(invitations.organizationId, organizationId),
				),
			)
			.returning();
		if (deleted.length === 0) return c.json({ error: "Not found" }, 404);
		return c.json({ ok: true });
	});
