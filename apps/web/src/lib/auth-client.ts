import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { API_BASE } from "#/lib/api";

// Better Auth のクライアント。セッションCookieをクロスオリジンで送るため credentials を含める。
export const authClient = createAuthClient({
	baseURL: `${API_BASE}/api/auth`,
	fetchOptions: { credentials: "include" },
	plugins: [emailOTPClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
