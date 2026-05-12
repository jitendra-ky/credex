ALTER TABLE "audits" ADD COLUMN "is_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "shared_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_is_shared_idx" ON "audits" ("is_shared");