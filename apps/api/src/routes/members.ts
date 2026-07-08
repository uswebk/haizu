import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { type Role, RoleSchema } from "@haiz/shared";
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
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const INVITE_TTL_DAYS = 7;

const inviteInput = z.object({
	lastName: z.string().min(1),
	firstName: z.string(),
	email: z.string().email(),
	role: RoleSchema,
	siteIds: z.array(z.string().uuid()),
});

const updateInput = z.object({
	role: RoleSchema,
	siteIds: z.array(z.string().uuid()),
	isActive: z.boolean(),
});

type MemberResponse = {
	id: string;
	kind: "user" | "invitation";
	name: string;
	email: string;
	role: Role;
	siteIds: string[];
	allSites: boolean;
	status: "active" | "inactive" | "invited";
};

// 指定した組織に属する拠点idのみを許可する（他組織の拠点混入を防ぐ）
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

export const membersRoute = new Hono<AppEnv>()
	.use("*", requireAuth)

	.get("/", async (c) => {
		const organizationId = c.get("organizationId");

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

		const members: MemberResponse[] = [
			...users.map((u) => ({
				id: u.id,
				kind: "user" as const,
				name: u.name,
				email: u.email,
				role: u.role,
				siteIds: userSiteLinks
					.filter((l) => l.userId === u.id)
					.map((l) => l.siteId),
				allSites: u.role === "admin",
				status: (u.isActive ? "active" : "inactive") as "active" | "inactive",
			})),
			...pending
				.filter((i) => i.acceptedAt === null)
				.map((i) => ({
					id: i.id,
					kind: "invitation" as const,
					name: `${i.lastName} ${i.firstName}`.trim(),
					email: i.email,
					role: i.role,
					siteIds: invitationSiteLinks
						.filter((l) => l.invitationId === i.id)
						.map((l) => l.siteId),
					allSites: i.role === "admin",
					status: "invited" as const,
				})),
		];

		return c.json({ members });
	})

	.post("/invite", zValidator("json", inviteInput), async (c) => {
		const organizationId = c.get("organizationId");
		const input = c.req.valid("json");
		const siteIds = input.role === "admin" ? [] : input.siteIds;

		if (!(await assertSitesInOrg(organizationId, siteIds))) {
			return c.json({ error: "この事業所に存在しない拠点が含まれています" }, 400);
		}

		// 同一組織で既にメンバー登録済み / 招待中のメールは弾く
		const existingUser = await db.query.user.findFirst({
			where: and(
				eq(user.organizationId, organizationId),
				eq(user.email, input.email),
			),
		});
		if (existingUser) {
			return c.json({ error: "このメールアドレスは既にメンバーです" }, 400);
		}
		const existingInvite = await db.query.invitations.findFirst({
			where: and(
				eq(invitations.organizationId, organizationId),
				eq(invitations.email, input.email),
			),
		});
		if (existingInvite && existingInvite.acceptedAt === null) {
			return c.json({ error: "このメールアドレスは既に招待済みです" }, 400);
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
					role: input.role,
					token: randomUUID(),
					expiresAt,
				})
				.returning();
			const row = inserted[0];
			if (!row) throw new Error("Insert failed");
			if (siteIds.length > 0) {
				await tx
					.insert(invitationSites)
					.values(siteIds.map((siteId) => ({ invitationId: row.id, siteId })));
			}
			return row;
		});

		const member: MemberResponse = {
			id: invitation.id,
			kind: "invitation",
			name: `${invitation.lastName} ${invitation.firstName}`.trim(),
			email: invitation.email,
			role: invitation.role,
			siteIds,
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

		if (actor.role !== "admin" && actor.role !== "site_admin") {
			return c.json({ error: "権限を変更する権限がありません" }, 403);
		}

		const target = await db.query.user.findFirst({
			where: and(eq(user.id, id), eq(user.organizationId, organizationId)),
		});
		if (!target) return c.json({ error: "Not found" }, 404);

		// ドメイン: 自身の権限は変更できない
		if (actor.id === target.id && input.role !== target.role) {
			return c.json({ error: "自身の権限は変更できません" }, 403);
		}
		// ドメイン: 拠点管理者は「管理者」権限の付与・変更ができない
		if (
			actor.role === "site_admin" &&
			(target.role === "admin" || input.role === "admin")
		) {
			return c.json({ error: "拠点管理者は管理者権限を設定できません" }, 403);
		}

		const siteIds = input.role === "admin" ? [] : input.siteIds;
		if (!(await assertSitesInOrg(organizationId, siteIds))) {
			return c.json({ error: "この事業所に存在しない拠点が含まれています" }, 400);
		}

		await db.transaction(async (tx) => {
			await tx
				.update(user)
				.set({ role: input.role, isActive: input.isActive, updatedAt: new Date() })
				.where(eq(user.id, id));
			await tx.delete(memberSites).where(eq(memberSites.userId, id));
			if (siteIds.length > 0) {
				await tx
					.insert(memberSites)
					.values(siteIds.map((siteId) => ({ userId: id, siteId })));
			}
		});

		const member: MemberResponse = {
			id: target.id,
			kind: "user",
			name: target.name,
			email: target.email,
			role: input.role,
			siteIds,
			allSites: input.role === "admin",
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
