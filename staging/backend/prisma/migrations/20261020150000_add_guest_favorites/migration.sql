CREATE TABLE "guest_favorites" (
  "id" UUID NOT NULL,
  "guest_id" UUID NOT NULL,
  "property_id" VARCHAR(100) NOT NULL,
  "property_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guest_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guest_favorites_guest_id_property_id_key"
  ON "guest_favorites"("guest_id", "property_id");
CREATE INDEX "guest_favorites_guest_id_created_at_idx"
  ON "guest_favorites"("guest_id", "created_at");

ALTER TABLE "guest_favorites"
  ADD CONSTRAINT "guest_favorites_guest_id_fkey"
  FOREIGN KEY ("guest_id") REFERENCES "guest_users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
