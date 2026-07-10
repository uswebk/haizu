ALTER TABLE "invitations" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "invitation_sites" ADD COLUMN "role" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "member_sites" ADD COLUMN "role" text DEFAULT 'general' NOT NULL;