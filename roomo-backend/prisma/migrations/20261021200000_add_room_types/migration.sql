-- Add property-specific room types without changing existing property or reservation data.
CREATE TABLE "room_types" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "nightly_price" DECIMAL(10,2) NOT NULL,
  "max_guests" INTEGER NOT NULL DEFAULT 2,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "bed_configuration" JSONB NOT NULL DEFAULT '[]',
  "facilities" JSONB NOT NULL DEFAULT '[]',
  "image_urls" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "room_types_property_id_name_key" ON "room_types"("property_id", "name");
CREATE INDEX "room_types_property_id_is_active_sort_order_idx" ON "room_types"("property_id", "is_active", "sort_order");
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD COLUMN "room_type_id" UUID;
CREATE INDEX "reservations_room_type_id_check_in_check_out_status_idx" ON "reservations"("room_type_id", "check_in", "check_out", "status");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
