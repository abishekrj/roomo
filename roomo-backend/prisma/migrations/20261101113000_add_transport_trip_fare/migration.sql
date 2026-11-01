ALTER TABLE "transport_bookings"
ADD COLUMN "total_trip_fare" DECIMAL(12,2);

ALTER TABLE "transport_bookings"
ADD CONSTRAINT "transport_bookings_total_trip_fare_nonnegative"
CHECK ("total_trip_fare" IS NULL OR "total_trip_fare" >= 0);
