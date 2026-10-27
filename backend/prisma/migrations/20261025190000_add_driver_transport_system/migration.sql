CREATE TABLE "drivers" (
  "id" UUID NOT NULL,
  "full_name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone_number" VARCHAR(32) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "license_number" VARCHAR(80),
  "vehicle_type" VARCHAR(40) NOT NULL,
  "vehicle_make" VARCHAR(80),
  "vehicle_model" VARCHAR(80),
  "vehicle_number" VARCHAR(30) NOT NULL,
  "passenger_capacity" INTEGER NOT NULL DEFAULT 4,
  "service_areas" JSONB NOT NULL DEFAULT '[]',
  "notes" VARCHAR(1000),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");
CREATE UNIQUE INDEX "drivers_phone_number_key" ON "drivers"("phone_number");
CREATE INDEX "drivers_is_active_is_available_vehicle_type_idx" ON "drivers"("is_active", "is_available", "vehicle_type");

CREATE TABLE "transport_bookings" (
  "id" UUID NOT NULL,
  "booking_code" VARCHAR(24) NOT NULL,
  "guest_name" VARCHAR(120) NOT NULL,
  "guest_phone" VARCHAR(32) NOT NULL,
  "guest_email" VARCHAR(254),
  "pickup_location" VARCHAR(500) NOT NULL,
  "dropoff_location" VARCHAR(500) NOT NULL,
  "travel_at" TIMESTAMP(3) NOT NULL,
  "passenger_count" INTEGER NOT NULL DEFAULT 1,
  "vehicle_type" VARCHAR(40) NOT NULL,
  "notes" VARCHAR(1000),
  "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  "assigned_driver_id" UUID,
  "assigned_at" TIMESTAMP(3),
  "dispatch_expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_bookings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "transport_bookings_booking_code_key" ON "transport_bookings"("booking_code");
CREATE INDEX "transport_bookings_status_travel_at_idx" ON "transport_bookings"("status", "travel_at");
CREATE INDEX "transport_bookings_assigned_driver_id_travel_at_status_idx" ON "transport_bookings"("assigned_driver_id", "travel_at", "status");
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "driver_offers" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OFFERED',
  "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_offers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "driver_offers_booking_id_driver_id_key" ON "driver_offers"("booking_id", "driver_id");
CREATE INDEX "driver_offers_driver_id_status_expires_at_idx" ON "driver_offers"("driver_id", "status", "expires_at");
ALTER TABLE "driver_offers" ADD CONSTRAINT "driver_offers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "transport_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_offers" ADD CONSTRAINT "driver_offers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "driver_push_subscriptions" (
  "id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "user_agent" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_push_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "driver_push_subscriptions_endpoint_key" ON "driver_push_subscriptions"("endpoint");
CREATE INDEX "driver_push_subscriptions_driver_id_idx" ON "driver_push_subscriptions"("driver_id");
ALTER TABLE "driver_push_subscriptions" ADD CONSTRAINT "driver_push_subscriptions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
