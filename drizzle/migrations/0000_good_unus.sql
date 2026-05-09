DO $$ BEGIN
 CREATE TYPE "audit_tag" AS ENUM('high-savings', 'medium', 'optimal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tools_json" jsonb NOT NULL,
	"results_json" jsonb NOT NULL,
	"tag" "audit_tag" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
