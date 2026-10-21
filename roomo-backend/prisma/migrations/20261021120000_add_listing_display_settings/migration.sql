-- Additive listing-display settings and property room details. Existing rows are preserved.
ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "living_rooms" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "kitchens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "area_square_meters" DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS "bed_configuration" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "allow_pay_at_property" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "availability_count" INTEGER;

CREATE TABLE IF NOT EXISTS "listing_display_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "settings" JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listing_display_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "listing_display_config" ("id", "settings", "updated_at")
VALUES (1, '{
  "showAccommodationSummary": true,
  "showBedDetails": true,
  "showPaymentMessage": true,
  "showAvailabilityMessage": true,
  "showLocation": true,
  "showGuestRating": true,
  "showDescription": false,
  "paymentMessage": "No prepayment needed – pay at the property",
  "availabilityMessageTemplate": "We have {count} left at this price"
}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
