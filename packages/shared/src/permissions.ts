import {
	type OrgRole,
	SITE_ROLES,
	type SiteRole,
} from "./schemas/user";

// 権限の単一の情報源。API の認可ミドルウェアと、フロントの画面・ナビ制御が
// どちらもこの表を読む（API とUIで権限定義が二重管理になるのを防ぐ）。
// 組織スコープの操作。拠点をまたぐため OrgRole で判定する。
export const ORG_PERMISSIONS = {
	"org:write": ["admin"],
	"site:manage": ["admin"],
} as const satisfies Record<string, readonly OrgRole[]>;

export type OrgPermission = keyof typeof ORG_PERMISSIONS;

// 拠点スコープの操作。対象拠点における SiteRole で判定する。
export const SITE_PERMISSIONS = {
	"member:manage": ["site_admin"],
	"employee:write": ["site_admin"],
	"area:write": ["site_admin"],
	"assignment:write": ["site_admin"],
	"shift:write": ["site_admin"],
	"tag:write": ["site_admin"],
	"viewer_config:write": ["site_admin"],
	"assignment_history:read": ["site_admin", "general"],
	// 拠点データの共通読み取り。ビュアー画面が配置エリア・配置・従業員・シフトを
	// 必要とするため、viewer を含む全拠点ロールに開く。画面単位の制御は SCREENS で行う。
	"site_data:read": SITE_ROLES,
} as const satisfies Record<string, readonly SiteRole[]>;

export type SitePermission = keyof typeof SITE_PERMISSIONS;

// 管理者は全拠点で拠点管理者として振る舞う。所属(member_sites)を持たなくてもよい。
// member はその拠点に所属していなければ null（＝拠点データに一切アクセスできない）。
export function effectiveSiteRole(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): SiteRole | null {
	return orgRole === "admin" ? "site_admin" : siteRole;
}

export function canOrg(orgRole: OrgRole, permission: OrgPermission): boolean {
	return (ORG_PERMISSIONS[permission] as readonly OrgRole[]).includes(orgRole);
}

export function canSite(
	siteRole: SiteRole | null,
	permission: SitePermission,
): boolean {
	if (!siteRole) return false;
	return (SITE_PERMISSIONS[permission] as readonly SiteRole[]).includes(
		siteRole,
	);
}

// 画面（フロントのルート）に対する権限。サイドナビの出し分けとルートガードが使う。
// 組織スコープの画面は OrgRole、拠点スコープの画面は実効 SiteRole で判定する。
const ORG_SCREENS = {
	sites: ["admin"],
	"organization-settings": ["admin"],
} as const satisfies Record<string, readonly OrgRole[]>;

const SITE_SCREENS = {
	home: ["site_admin", "general"],
	editor: ["site_admin"],
	assignment: ["site_admin"],
	history: ["site_admin", "general"],
	viewer: SITE_ROLES,
	employees: ["site_admin"],
	settings: ["site_admin"],
	members: ["site_admin"],
} as const satisfies Record<string, readonly SiteRole[]>;

export type Screen =
	| keyof typeof ORG_SCREENS
	| keyof typeof SITE_SCREENS
	// 自身の情報変更は全ロールが行えるため、どちらのスコープにも属さない
	| "account";

export function canAccessScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
	screen: Screen,
): boolean {
	if (screen === "account") return true;
	if (screen in ORG_SCREENS) {
		const allowed = ORG_SCREENS[screen as keyof typeof ORG_SCREENS];
		return (allowed as readonly OrgRole[]).includes(orgRole);
	}
	const allowed = SITE_SCREENS[screen as keyof typeof SITE_SCREENS];
	const effective = effectiveSiteRole(orgRole, siteRole);
	if (!effective) return false;
	return (allowed as readonly SiteRole[]).includes(effective);
}

// 画面表示用のロール。組織ロールと拠点ロールを1つのラベルに落とす。
// 認可判定には使わないこと（判定は canOrg / canSite）。
export type DisplayRole = "admin" | SiteRole;

export function displayRole(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): DisplayRole | null {
	if (orgRole === "admin") return "admin";
	return siteRole;
}

// ログイン直後・拠点選択後の着地画面。ホームを見られないロールはビュアーへ送る。
// どの拠点にも所属しない member は、拠点データを一切見られないためアカウント設定へ。
// パスは拠点(siteId)に依存するため、URLの組み立ては呼び出し側で行う。
export function landingScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): "home" | "viewer" | "account" {
	if (canAccessScreen(orgRole, siteRole, "home")) return "home";
	if (canAccessScreen(orgRole, siteRole, "viewer")) return "viewer";
	return "account";
}
