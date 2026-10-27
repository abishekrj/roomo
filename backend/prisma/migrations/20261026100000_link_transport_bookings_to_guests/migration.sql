ALTER TABLE "transport_bookings"
ADD COLUMN "guest_user_id" UUID;

CREATE INDEX "transport_bookings_guest_user_id_created_at_idx"
ON "transport_bookings"("guest_user_id", "created_at");

ALTER TABLE "transport_bookings"
ADD CONSTRAINT "transport_bookings_guest_user_id_fkey"
FOREIGN KEY ("guest_user_id") REFERENCES "guest_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
