import { type OrgRole, OrgRoleSchema, SiteRoleSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db/client";
import { invitationSites, invitations, memberSites, user } from "../../db/schema";
import {
	authorizeInvite,
	createInvitations,
	findTakenEmails,
} from "./invitation";
import {
	assertSitesManageable,
	evaluateOrgRoleAssignment,
} from "./role-policy";
import {
	assertSitesInOrg,
	manageableSiteIds,
	type SiteRoleAssignment,
} from "./scope";
import { requireAuth } from "../../middleware/auth";
import { requireSitePermission } from "../../middleware/require-permission";
import { siteScope } from "../../middleware/site-scope";
import type { AppEnv } from "../../types";

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

// Bulk invite from CSV: the permission set is chosen in the UI and applied to every row
const MAX_BULK_INVITES = 200;

const bulkInviteInput = z
	.object({
		members: z
			.array(
				z.object({
					lastName: z.string().min(1),
					firstName: z.string(),
					email: z.string().email(),
				}),
			)
			.min(1)
			.max(MAX_BULK_INVITES),
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
		const input = c.req.valid("json");

		const authorized = await authorizeInvite(
			organizationId,
			c.get("user"),
			input.orgRole,
			input.siteRoles,
		);
		if ("error" in authorized) {
			return c.json({ error: authorized.error }, authorized.status);
		}
		const { siteRoles } = authorized;

		const taken = await findTakenEmails(organizationId, [input.email]);
		if (taken.length > 0) {
			return c.json(
				{ error: "This email address is already a member or invited" },
				400,
			);
		}

		const [invitation] = await createInvitations(
			organizationId,
			[input],
			input.orgRole,
			siteRoles,
		);
		if (!invitation) throw new Error("Insert failed");

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

	.post("/invite/bulk", zValidator("json", bulkInviteInput), async (c) => {
		const organizationId = c.get("organizationId");
		const input = c.req.valid("json");

		const authorized = await authorizeInvite(
			organizationId,
			c.get("user"),
			input.orgRole,
			input.siteRoles,
		);
		if ("error" in authorized) {
			return c.json({ error: authorized.error }, authorized.status);
		}
		const { siteRoles } = authorized;

		const emails = input.members.map((m) => m.email.toLowerCase());
		if (new Set(emails).size !== emails.length) {
			return c.json({ error: "The CSV contains duplicate emails" }, 400);
		}

		const taken = await findTakenEmails(organizationId, emails);
		if (taken.length > 0) {
			return c.json(
				{ error: `Already a member or invited: ${taken.join(", ")}` },
				400,
			);
		}

		const created = await createInvitations(
			organizationId,
			input.members,
			input.orgRole,
			siteRoles,
		);
		return c.json({ created: created.length }, 201);
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
