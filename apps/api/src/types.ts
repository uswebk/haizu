import type { OrgRole, SiteRole } from "@haizu/shared";

// Type that passes the current user, organization, and site resolved by the auth/site-scope middleware to each handler.
export type AppEnv = {
	Variables: {
		user: { id: string; organizationId: string; role: OrgRole };
		organizationId: string;
		siteId: string;
		siteRole: SiteRole;
	};
};
