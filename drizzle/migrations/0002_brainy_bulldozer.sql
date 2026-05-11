CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid,
	"email" text NOT NULL,
	"company_name" text,
	"role" text,
	"ip_address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leads_email_unique" ON "leads" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_audit_id_idx" ON "leads" ("audit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_ip_address_idx" ON "leads" ("ip_address");