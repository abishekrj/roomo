-- Add an opt-in listing message without changing existing property data.
ALTER TABLE "properties"
ADD COLUMN IF NOT EXISTS "no_credit_card_required" BOOLEAN NOT NULL DEFAULT false;
