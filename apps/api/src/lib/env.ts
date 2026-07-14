// Centralizes environment-dependent config in one place. Values are injected from the runtime environment (12-factor).
// APP_ENV: local / dev / stg / prod. Unset is treated as "prod" on the safe side (disables dev features).
export const APP_ENV = process.env.APP_ENV ?? "prod";

// Gate for dev-only features. Fail-safe: enabled only for "local"; anything other than local is always disabled.
export function resolveIsLocal(appEnv?: string): boolean {
	return appEnv === "local";
}

export const isLocal = resolveIsLocal(APP_ENV);

// Frontend origin. Shared by CORS and Better Auth's trustedOrigins (varies per environment).
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
