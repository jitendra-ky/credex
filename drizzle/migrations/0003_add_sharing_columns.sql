ALTER TABLE "audits"
  ADD COLUMN IF NOT EXISTS "share_code" text;

ALTER TABLE "audits"
  ADD COLUMN IF NOT EXISTS "is_shared" boolean DEFAULT false NOT NULL;

ALTER TABLE "audits"
  ADD COLUMN IF NOT EXISTS "shared_at" timestamp with time zone;

-- Create unique index for share_code
CREATE UNIQUE INDEX IF NOT EXISTS "audits_share_code_unique" ON "audits" ("share_code");

-- Create indexes to speed lookups
CREATE INDEX IF NOT EXISTS "audits_share_code_idx" ON "audits" ("share_code");
CREATE INDEX IF NOT EXISTS "audits_is_shared_idx" ON "audits" ("is_shared");

-- Backfill existing audits to be shared to preserve pre-existing public access
UPDATE "audits" SET "is_shared" = true WHERE "is_shared" IS DISTINCT FROM true;
