import { randomUUID } from "node:crypto";
import type { OrgRole } from "@haizu/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { invitationSites, invitations, user } from "../db/schema";
import { emailSender } from "../email";
import { WEB_ORIGIN } from "./env";
import {
	type Actor,
	assertSitesInOrg,
	manageableSiteIds,
	type SiteRoleAssignment,
} from "./member-scope";
import {
	assertSitesManageable,
	evaluateOrgRoleAssignment,
} from "./member-role-policy";

export const INVITE_TTL_DAYS = 7;

export type Invitee = { lastName: string; firstName: string; email: string };

type InviteRejection = { error: string; status: 400 | 403 };

// Single and bulk invites share one permission set, applied to every invitee.
// Prevents privilege escalation via invitations, applying the same rules as updating a member.
export async function authorizeInvite(
	organizationId: string,
	actor: Actor,
	orgRole: OrgRole,
	requestedSiteRoles: SiteRoleAssignment[],
): Promise<{ siteRoles: SiteRoleAssignment[] } | InviteRejection> {
	const orgAssignment = evaluateOrgRoleAssignment({
		actorOrgRole: actor.role,
		isSelf: false,
		targetOrgRole: null,
		nextOrgRole: orgRole,
	});
	if (!orgAssignment.ok) {
		return { error: orgAssignment.message, status: orgAssignment.status };
	}

	// Admins can access all sites, so don't give them per-site assignments
	const siteRoles = orgRole === "admin" ? [] : requestedSiteRoles;
	const siteIds = siteRoles.map((s) => s.siteId);

	if (!(await assertSitesInOrg(organizationId, siteIds))) {
		return {
			error: "Includes a site that doesn't exist in this organization",
			status: 400,
		};
	}
	const scopeCheck = assertSitesManageable(
		await manageableSiteIds(organizationId, actor),
		siteIds,
	);
	if (!scopeCheck.ok) {
		return { error: scopeCheck.message, status: scopeCheck.status };
	}
	return { siteRoles };
}

// Emails already registered as a member / pending an invitation in the same organization.
// Mailboxes are case-insensitive and stored addresses aren't guaranteed to be lowercase, so look up both spellings.
export async function findTakenEmails(
	organizationId: string,
	emails: string[],
): Promise<string[]> {
	const lookup = [
		...new Set([...emails, ...emails.map((e) => e.toLowerCase())]),
	];

	const existingUsers = await db
		.select({ email: user.email })
		.from(user)
		.where(
			and(eq(user.organizationId, organizationId), inArray(user.email, lookup)),
		);
	const existingInvites = await db
		.select({ email: invitations.email, acceptedAt: invitations.acceptedAt })
		.from(invitations)
		.where(
			and(
				eq(invitations.organizationId, organizationId),
				inArray(invitations.email, lookup),
			),
		);

	return [
		...new Set([
			...existingUsers.map((r) => r.email),
			...existingInvites
				.filter((r) => r.acceptedAt === null)
				.map((r) => r.email),
		]),
	];
}

// Every invitee gets the same org role and site assignments
export async function createInvitations(
	organizationId: string,
	invitees: Invitee[],
	orgRole: OrgRole,
	siteRoles: SiteRoleAssignment[],
) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

	const created = await db.transaction(async (tx) => {
		const rows = await tx
			.insert(invitations)
			.values(
				invitees.map((m) => ({
					organizationId,
					lastName: m.lastName,
					firstName: m.firstName,
					email: m.email,
					role: orgRole,
					token: randomUUID(),
					expiresAt,
				})),
			)
			.returning();
		if (siteRoles.length > 0) {
			await tx.insert(invitationSites).values(
				rows.flatMap((row) =>
					siteRoles.map((s) => ({
						invitationId: row.id,
						siteId: s.siteId,
						role: s.role,
					})),
				),
			);
		}
		return rows;
	});

	// The invitations are already persisted, so a failed email must not roll them back.
	// The operator can cancel and re-invite from the member list.
	const results = await Promise.allSettled(
		created.map((row) =>
			emailSender.send({
				to: row.email,
				subject: "Member invitation",
				body: `${WEB_ORIGIN}/invite-accept?token=${row.token}`,
			}),
		),
	);
	for (const [i, result] of results.entries()) {
		if (result.status === "rejected") {
			console.error(
				`Failed to send invitation email to ${created[i]?.email}`,
				result.reason,
			);
		}
	}

	return created;
}
