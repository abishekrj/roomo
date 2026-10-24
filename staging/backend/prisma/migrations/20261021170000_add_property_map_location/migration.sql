-- Store an optional Google Maps pin/share URL for each property.
ALTER TABLE "properties"
ADD COLUMN IF NOT EXISTS "map_location" VARCHAR(1000);
