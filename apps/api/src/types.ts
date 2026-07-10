import type { OrgRole, SiteRole } from "@haizu/shared";

// 認証・拠点スコープ middleware が解決した現在のユーザー・組織・拠点を各ハンドラへ渡す型。
export type AppEnv = {
	Variables: {
		user: { id: string; organizationId: string; role: OrgRole };
		organizationId: string;
		siteId: string;
		siteRole: SiteRole;
	};
};
