CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon_bg" text NOT NULL,
	"icon_color" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- 既存データ保全のため、デフォルト組織・拠点を作成し site_id をバックフィルする
INSERT INTO "organizations" ("id", "name", "email")
VALUES ('00000000-0000-0000-0000-000000000001', 'デフォルト組織', 'admin@haiz.co.jp');--> statement-breakpoint
INSERT INTO "sites" ("id", "organization_id", "name", "description", "icon_bg", "icon_color")
VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'A工場', '製造ライン', '#dcf2f0', '#0ea5a4');--> statement-breakpoint
DROP INDEX "employees_code_unique";--> statement-breakpoint
DROP INDEX "tags_name_unique";--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "work_patterns" ADD COLUMN "site_id" uuid;--> statement-breakpoint
UPDATE "areas" SET "site_id" = '00000000-0000-0000-0000-000000000101' WHERE "site_id" IS NULL;--> statement-breakpoint
UPDATE "employees" SET "site_id" = '00000000-0000-0000-0000-000000000101' WHERE "site_id" IS NULL;--> statement-breakpoint
UPDATE "tags" SET "site_id" = '00000000-0000-0000-0000-000000000101' WHERE "site_id" IS NULL;--> statement-breakpoint
UPDATE "work_patterns" SET "site_id" = '00000000-0000-0000-0000-000000000101' WHERE "site_id" IS NULL;--> statement-breakpoint
-- 拠点ごと1レコード制約のため、重複する work_patterns を1件に集約（バックフィルで全て同一拠点になった場合）
DELETE FROM "work_patterns" a
USING "work_patterns" b
WHERE a."site_id" = b."site_id" AND a."created_at" > b."created_at";--> statement-breakpoint
ALTER TABLE "areas" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "work_patterns" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_patterns" ADD CONSTRAINT "work_patterns_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_site_id_code_unique" ON "employees" USING btree ("site_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_site_id_name_unique" ON "tags" USING btree ("site_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "work_patterns_site_id_unique" ON "work_patterns" USING btree ("site_id");
