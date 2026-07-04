import {
	boolean,
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const areas = pgTable("areas", {
	id: uuid("id").primaryKey().defaultRandom(),
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
	(t) => [uniqueIndex("employees_code_unique").on(t.code)],
);

export const tags = pgTable(
	"tags",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex("tags_name_unique").on(t.name)],
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
