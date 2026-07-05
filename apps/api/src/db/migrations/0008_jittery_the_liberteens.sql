CREATE TABLE "viewer_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"mode" text DEFAULT 'auto' NOT NULL,
	"display_date" date,
	"shift_id" uuid,
	"lead_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "viewer_configs" ADD CONSTRAINT "viewer_configs_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewer_configs" ADD CONSTRAINT "viewer_configs_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "viewer_configs_area_id_unique" ON "viewer_configs" USING btree ("area_id");