CREATE TABLE "invitation_sites" (
	"invitation_id" uuid NOT NULL,
	"site_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"last_name" text NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'general' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "member_sites" (
	"user_id" text NOT NULL,
	"site_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation_sites" ADD CONSTRAINT "invitation_sites_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_sites" ADD CONSTRAINT "invitation_sites_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_sites" ADD CONSTRAINT "member_sites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_sites" ADD CONSTRAINT "member_sites_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_sites_invitation_id_site_id_unique" ON "invitation_sites" USING btree ("invitation_id","site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_sites_user_id_site_id_unique" ON "member_sites" USING btree ("user_id","site_id");