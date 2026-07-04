ALTER TABLE "assignments" DROP CONSTRAINT "assignments_shift_id_shifts_id_fk";
--> statement-breakpoint
DROP INDEX "shifts_work_pattern_id_start_end_unique";--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_area_date_single_unique" ON "assignments" USING btree ("area_id","date") WHERE "assignments"."shift_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_work_pattern_id_name_unique" ON "shifts" USING btree ("work_pattern_id","name") WHERE "shifts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_work_pattern_id_start_end_unique" ON "shifts" USING btree ("work_pattern_id","start_time","end_time") WHERE "shifts"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "assignments" DROP COLUMN "shift_name";--> statement-breakpoint
ALTER TABLE "assignments" DROP COLUMN "shift_start_time";--> statement-breakpoint
ALTER TABLE "assignments" DROP COLUMN "shift_end_time";