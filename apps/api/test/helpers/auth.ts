import type { OrgRole } from "@haizu/shared";
import { eq } from "drizzle-orm";
import { app } from "../../src/app";
import { db } from "../../src/db/client";
import { user } from "../../src/db/schema";
import { auth } from "../../src/lib/auth";
import { signupContext } from "../../src/lib/signup-context";

let emailSeq = 0;
function uniqueEmail(prefix: string) {
	emailSeq += 1;
	return `${prefix}-${Date.now()}-${emailSeq}@example.com`;
}

const PASSWORD = "password1234";

export type TestUser = {
	cookie: string;
	userId: string;
	organizationId: string;
	email: string;
};

// カスタムサインアップ(/auth/sign-up)で組織 + admin ユーザーを作り、本物のセッション Cookie を得る。
// requireAuth は emailVerified を要求するため、OTP フローの代わりに DB を直接更新して検証済みにする。
export async function signUpOrg(companyName = "テスト株式会社"): Promise<TestUser> {
	const email = uniqueEmail("owner");
	const res = await app.request("/auth/sign-up", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			name: "テスト 管理者",
			companyName,
			email,
			password: PASSWORD,
		}),
	});
	if (!res.ok) {
		throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);
	}
	const cookie = extractCookie(res);

	const created = await db.query.user.findFirst({ where: eq(user.email, email) });
	if (!created) throw new Error("sign-up did not create a user");
	await verifyEmail(created.id);

	return {
		cookie,
		userId: created.id,
		organizationId: created.organizationId,
		email,
	};
}

// 既存組織にメンバー(user)を追加してサインイン Cookie を返す。
// organizationId / role はクライアントから注入できない設計なので、サーバー内部と同じ signupContext 経由で作る。
export async function createMemberUser(
	organizationId: string,
	role: OrgRole = "member",
): Promise<TestUser> {
	const email = uniqueEmail(role);
	const signUpRes = await signupContext.run({ organizationId, role }, () =>
		auth.api.signUpEmail({
			body: { name: `テスト ${role}`, email, password: PASSWORD },
		}),
	);
	await verifyEmail(signUpRes.user.id);

	const signInRes = await auth.api.signInEmail({
		body: { email, password: PASSWORD },
		asResponse: true,
	});
	if (!signInRes.ok) {
		throw new Error(`sign-in failed: ${signInRes.status}`);
	}
	return {
		cookie: extractCookie(signInRes),
		userId: signUpRes.user.id,
		organizationId,
		email,
	};
}

async function verifyEmail(userId: string) {
	await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId));
}

function extractCookie(res: Response): string {
	const setCookies = res.headers.getSetCookie();
	if (setCookies.length === 0) throw new Error("no Set-Cookie in response");
	return setCookies.map((c) => c.split(";")[0]).join("; ");
}

type RequestOptions = {
	cookie?: string;
	siteId?: string;
	method?: string;
	body?: unknown;
};

// cookie と x-site-id を付けて app.request() を呼ぶラッパ
export async function authedRequest(
	path: string,
	{ cookie, siteId, method = "GET", body }: RequestOptions = {},
): Promise<Response> {
	const headers: Record<string, string> = {};
	if (cookie) headers.cookie = cookie;
	if (siteId) headers["x-site-id"] = siteId;
	if (body !== undefined) headers["content-type"] = "application/json";
	return app.request(path, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
}
