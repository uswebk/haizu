CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"last_name" text NOT NULL,
	"first_name" text NOT NULL,
	"avatar_color" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layout_spec_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"plan_image_url" text,
	"plan_image_name" text,
	"plan_aspect_ratio" real,
	"plan_image_scale" real DEFAULT 1 NOT NULL,
	"plan_image_offset_x" real DEFAULT 0 NOT NULL,
	"plan_image_offset_y" real DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_spec_version_id" uuid NOT NULL,
	"label" text NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"size" integer DEFAULT 56 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "layout_spec_versions" ADD CONSTRAINT "layout_spec_versions_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_layout_spec_version_id_layout_spec_versions_id_fk" FOREIGN KEY ("layout_spec_version_id") REFERENCES "public"."layout_spec_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_unique" ON "employees" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "layout_spec_versions_area_id_version_unique" ON "layout_spec_versions" USING btree ("area_id","version");