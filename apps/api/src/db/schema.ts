import { sql } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email"),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const sites = pgTable("sites", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description").notNull().default(""),
	iconBg: text("icon_bg").notNull(),
	iconColor: text("icon_color").notNull(),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const areas = pgTable("areas", {
	id: uuid("id").primaryKey().defaultRandom(),
	siteId: uuid("site_id")
		.notNull()
		.references(() => sites.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const layoutSpecVersions = pgTable(
	"layout_spec_versions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		areaId: uuid("area_id")
			.notNull()
			.references(() => areas.id, { onDelete: "cascade" }),
		version: integer("version").notNull().default(1),
		status: text("status", { enum: ["draft", "published"] })
			.notNull()
			.default("draft"),
		planImageUrl: text("plan_image_url"),
		planImageName: text("plan_image_name"),
		planAspectRatio: real("plan_aspect_ratio"),
		planImageScale: real("plan_image_scale").notNull().default(1),
		planImageOffsetX: real("plan_image_offset_x").notNull().default(0),
		planImageOffsetY: real("plan_image_offset_y").notNull().default(0),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		// 公開バージョンが配置決めで適用され始める日（配置決めはこの日以降、日付ごとに該当バージョンを解決する）
		// draft時点では未設定のためデフォルトは十分に過去の日付にしておく
		effectiveDate: date("effective_date").notNull().default("1000-01-01"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex("layout_spec_versions_area_id_version_unique").on(
			t.areaId,
			t.version,
		),
	],
);

export const employees = pgTable(
	"employees",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		siteId: uuid("site_id")
			.notNull()
			.references(() => sites.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		lastName: text("last_name").notNull(),
		firstName: text("first_name").notNull(),
		avatarColor: text("avatar_color").notNull(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	// 従業員コードは拠点内で一意
	(t) => [uniqueIndex("employees_site_id_code_unique").on(t.siteId, t.code)],
);

export const tags = pgTable(
	"tags",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		siteId: uuid("site_id")
			.notNull()
			.references(() => sites.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	// タグ名は拠点内で一意
	(t) => [uniqueIndex("tags_site_id_name_unique").on(t.siteId, t.name)],
);

export const employeeTags = pgTable(
	"employee_tags",
	{
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("employee_tags_employee_id_tag_id_unique").on(
			t.employeeId,
			t.tagId,
		),
	],
);

export const workPatterns = pgTable(
	"work_patterns",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		siteId: uuid("site_id")
			.notNull()
			.references(() => sites.id, { onDelete: "cascade" }),
		mode: text("mode", { enum: ["single", "multi"] })
			.notNull()
			.default("single"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	// 拠点ごとに1レコード
	(t) => [uniqueIndex("work_patterns_site_id_unique").on(t.siteId)],
);

export const shifts = pgTable(
	"shifts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workPatternId: uuid("work_pattern_id")
			.notNull()
			.references(() => workPatterns.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		startTime: text("start_time").notNull(),
		endTime: text("end_time").notNull(),
		order: integer("order").notNull().default(0),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(t) => [
		uniqueIndex("shifts_work_pattern_id_start_end_unique")
			.on(t.workPatternId, t.startTime, t.endTime)
			.where(sql`${t.deletedAt} IS NULL`),
		uniqueIndex("shifts_work_pattern_id_name_unique")
			.on(t.workPatternId, t.name)
			.where(sql`${t.deletedAt} IS NULL`),
	],
);

export const spots = pgTable("spots", {
	id: uuid("id").primaryKey().defaultRandom(),
	layoutSpecVersionId: uuid("layout_spec_version_id")
		.notNull()
		.references(() => layoutSpecVersions.id, { onDelete: "cascade" }),
	label: text("label").notNull(),
	x: real("x").notNull(),
	y: real("y").notNull(),
	size: integer("size").notNull().default(56),
	order: integer("order").notNull().default(0),
});

export const assignments = pgTable(
	"assignments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		areaId: uuid("area_id")
			.notNull()
			.references(() => areas.id, { onDelete: "cascade" }),
		layoutSpecVersionId: uuid("layout_spec_version_id")
			.notNull()
			.references(() => layoutSpecVersions.id),
		date: date("date").notNull(),
		// null = シフトなし（終日）。シフトは append-only（物理削除しない）なので参照は壊れず、
		// 参照先のシフト行（soft-delete 含む）が当時のシフト定義＝履歴を保全する
		shiftId: uuid("shift_id").references(() => shifts.id, {
			onDelete: "no action",
		}),
		status: text("status", { enum: ["draft", "confirmed"] })
			.notNull()
			.default("draft"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex("assignments_area_date_shift_unique")
			.on(t.areaId, t.date, t.shiftId)
			.where(sql`${t.shiftId} IS NOT NULL`),
		uniqueIndex("assignments_area_date_single_unique")
			.on(t.areaId, t.date)
			.where(sql`${t.shiftId} IS NULL`),
	],
);

export const spotAssignments = pgTable(
	"spot_assignments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		assignmentId: uuid("assignment_id")
			.notNull()
			.references(() => assignments.id, { onDelete: "cascade" }),
		spotId: uuid("spot_id")
			.notNull()
			.references(() => spots.id, { onDelete: "cascade" }),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employees.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("spot_assignments_assignment_id_spot_id_unique").on(
			t.assignmentId,
			t.spotId,
		),
	],
);

// 大画面ビュアーの表示方法をエリアごとに保持する（manual=強制表示 / auto=働き方に合わせて自動表示）
export const viewerConfigs = pgTable(
	"viewer_configs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		areaId: uuid("area_id")
			.notNull()
			.references(() => areas.id, { onDelete: "cascade" }),
		mode: text("mode", { enum: ["manual", "auto"] })
			.notNull()
			.default("auto"),
		// manual: 強制表示する日付・シフト（shiftId null = 終日）
		displayDate: date("display_date"),
		shiftId: uuid("shift_id").references(() => shifts.id, {
			onDelete: "no action",
		}),
		// auto: シフト開始の何分前から次シフトの配置に切り替えるか
		leadMinutes: integer("lead_minutes").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex("viewer_configs_area_id_unique").on(t.areaId)],
);

// --- Better Auth (email/password) ---
// user/session/account/verification は Better Auth core が要求するテーブル。
// user には独自フィールド（所属組織・権限・有効状態）を追加している。
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	// 独自フィールド
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	role: text("role", {
		enum: ["admin", "site_admin", "general", "viewer"],
	})
		.notNull()
		.default("admin"),
	isActive: boolean("is_active").notNull().default(true),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
		withTimezone: true,
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

const MEMBER_ROLES = ["admin", "site_admin", "general", "viewer"] as const;

// メンバー(user)の担当拠点。admin は全拠点扱いのため紐付けを持たない。
export const memberSites = pgTable(
	"member_sites",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		siteId: uuid("site_id")
			.notNull()
			.references(() => sites.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("member_sites_user_id_site_id_unique").on(t.userId, t.siteId),
	],
);

// 招待。メールで招待し、パスワード設定完了で user 化する（受け入れフローは別途）。
export const invitations = pgTable("invitations", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	lastName: text("last_name").notNull(),
	firstName: text("first_name").notNull().default(""),
	email: text("email").notNull(),
	role: text("role", { enum: MEMBER_ROLES }).notNull().default("general"),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	acceptedAt: timestamp("accepted_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// 招待の担当拠点。user 化した際に member_sites へ引き継ぐ想定。
export const invitationSites = pgTable(
	"invitation_sites",
	{
		invitationId: uuid("invitation_id")
			.notNull()
			.references(() => invitations.id, { onDelete: "cascade" }),
		siteId: uuid("site_id")
			.notNull()
			.references(() => sites.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("invitation_sites_invitation_id_site_id_unique").on(
			t.invitationId,
			t.siteId,
		),
	],
);
