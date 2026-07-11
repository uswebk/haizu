import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { API_BASE } from "#/lib/api";

// Better Auth client. Includes credentials so the session cookie is sent cross-origin.
export const authClient = createAuthClient({
	baseURL: `${API_BASE}/api/auth`,
	fetchOptions: { credentials: "include" },
	plugins: [emailOTPClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
