ALTER TABLE "layout_spec_versions" ALTER COLUMN "effective_date" SET DEFAULT '1000-01-01';--> statement-breakpoint
UPDATE "layout_spec_versions" SET "effective_date" = '1000-01-01' WHERE "effective_date" IS NULL;--> statement-breakpoint
ALTER TABLE "layout_spec_versions" ALTER COLUMN "effective_date" SET NOT NULL;