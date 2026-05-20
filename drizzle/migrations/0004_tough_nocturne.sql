DO $$ BEGIN
 CREATE TYPE "notification_status" AS ENUM('pending', 'sent', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"audit_id" uuid NOT NULL,
	"previous_audit_id" uuid,
	"engine_version" text NOT NULL,
	"is_stale" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reaudit_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"engine_version" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_audits_lead_id_idx" ON "lead_audits" ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_audits_audit_id_idx" ON "lead_audits" ("audit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_audits_is_stale_idx" ON "lead_audits" ("is_stale");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lead_audits_lead_version_unique" ON "lead_audits" ("lead_id","engine_version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaudit_notifications_lead_id_idx" ON "reaudit_notifications" ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaudit_notifications_status_idx" ON "reaudit_notifications" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reaudit_notifications_lead_version_unique" ON "reaudit_notifications" ("lead_id","engine_version");