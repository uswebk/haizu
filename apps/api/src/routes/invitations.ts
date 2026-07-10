import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { invitationSites, invitations, memberSites, user } from "../db/schema";
import { auth } from "../lib/auth";
import { signupContext } from "../lib/signup-context";

const acceptInput = z.object({
	password: z.string().min(8),
});

type InvitationState =
	| { ok: true; invitation: typeof invitations.$inferSelect }
	| { ok: false; status: 404 | 410; message: string };

async function resolveInvitation(token: string): Promise<InvitationState> {
	const invitation = await db.query.invitations.findFirst({
		where: eq(invitations.token, token),
	});
	if (!invitation) {
		return { ok: false, status: 404, message: "招待が見つかりません" };
	}
	if (invitation.acceptedAt !== null) {
		return {
			ok: false,
			status: 410,
			message: "この招待は既に使用されています",
		};
	}
	if (invitation.expiresAt < new Date()) {
		return {
			ok: false,
			status: 410,
			message: "この招待の有効期限が切れています",
		};
	}
	return { ok: true, invitation };
}

export const invitationsRoute = new Hono()
	.get("/:token", async (c) => {
		const { token } = c.req.param();
		const state = await resolveInvitation(token);
		if (!state.ok) return c.json({ error: state.message }, state.status);

		const { lastName, firstName, email, role } = state.invitation;
		return c.json({ lastName, firstName, email, orgRole: role });
	})

	.post("/:token/accept", zValidator("json", acceptInput), async (c) => {
		const { token } = c.req.param();
		const { password } = c.req.valid("json");
		const state = await resolveInvitation(token);
		if (!state.ok) return c.json({ error: state.message }, state.status);
		const { invitation } = state;

		let createdUserId: string;
		try {
			const result = await signupContext.run(
				{ organizationId: invitation.organizationId, role: invitation.role },
				() =>
					auth.api.signUpEmail({
						body: {
							name: `${invitation.lastName} ${invitation.firstName}`.trim(),
							email: invitation.email,
							password,
						},
					}),
			);
			createdUserId = result.user.id;
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: "アカウントの作成に失敗しました";
			return c.json({ error: message }, 400);
		}

		// 招待リンクを踏めた時点でメール到達性は確認済みとみなし、OTPを挟まず確認済みにする
		await db
			.update(user)
			.set({ emailVerified: true })
			.where(eq(user.id, createdUserId));

		const siteLinks = await db
			.select({ siteId: invitationSites.siteId, role: invitationSites.role })
			.from(invitationSites)
			.where(eq(invitationSites.invitationId, invitation.id));

		await db.transaction(async (tx) => {
			if (siteLinks.length > 0) {
				await tx
					.insert(memberSites)
					.values(
						siteLinks.map((l) => ({
							userId: createdUserId,
							siteId: l.siteId,
							role: l.role,
						})),
					);
			}
			await tx
				.update(invitations)
				.set({ acceptedAt: new Date() })
				.where(eq(invitations.id, invitation.id));
		});

		return c.json({ ok: true });
	});
