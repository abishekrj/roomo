ALTER TABLE "properties"
  ADD COLUMN "media" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "policies" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN "show_policies" BOOLEAN NOT NULL DEFAULT true;
