-- Add bookable property units and guest reservations. Additive migration; existing records are preserved.
ALTER TABLE "properties"
  ADD COLUMN "total_units" INTEGER NOT NULL DEFAULT 1;

CREATE TYPE "ReservationStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED');

CREATE TABLE "reservations" (
  "id" UUID NOT NULL,
  "reservation_code" TEXT NOT NULL,
  "guest_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "check_in" DATE NOT NULL,
  "check_out" DATE NOT NULL,
  "adults" INTEGER NOT NULL,
  "children" INTEGER NOT NULL DEFAULT 0,
  "room_count" INTEGER NOT NULL DEFAULT 1,
  "nights" INTEGER NOT NULL,
  "nightly_price" DECIMAL(10,2) NOT NULL,
  "total_amount" DECIMAL(12,2) NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'REQUESTED',
  "special_requests" VARCHAR(1000),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reservations_date_order_check" CHECK ("check_out" > "check_in"),
  CONSTRAINT "reservations_adults_check" CHECK ("adults" > 0),
  CONSTRAINT "reservations_children_check" CHECK ("children" >= 0),
  CONSTRAINT "reservations_room_count_check" CHECK ("room_count" > 0),
  CONSTRAINT "reservations_nights_check" CHECK ("nights" > 0),
  CONSTRAINT "reservations_price_check" CHECK ("nightly_price" >= 0 AND "total_amount" >= 0)
);

CREATE UNIQUE INDEX "reservations_reservation_code_key" ON "reservations"("reservation_code");
CREATE INDEX "reservations_property_id_check_in_check_out_status_idx" ON "reservations"("property_id", "check_in", "check_out", "status");
CREATE INDEX "reservations_guest_id_created_at_idx" ON "reservations"("guest_id", "created_at");

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_guest_id_fkey"
  FOREIGN KEY ("guest_id") REFERENCES "guest_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
