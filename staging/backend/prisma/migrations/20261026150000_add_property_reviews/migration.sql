-- Add guest reviews for the staging API. Use IF NOT EXISTS to safely support databases
-- where the review table was already created by an earlier deployment.
CREATE TABLE IF NOT EXISTS "property_reviews" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "guest_id" UUID NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "comment" VARCHAR(2000) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_reviews_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guest_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "property_reviews_property_id_status_created_at_idx" ON "property_reviews"("property_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "property_reviews_guest_id_created_at_idx" ON "property_reviews"("guest_id", "created_at");
ALTER TABLE "property_reviews" ALTER COLUMN "rating" TYPE DOUBLE PRECISION USING "rating"::DOUBLE PRECISION;
