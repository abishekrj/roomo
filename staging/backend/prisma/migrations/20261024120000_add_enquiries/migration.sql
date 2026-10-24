CREATE TABLE "enquiries" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "guest_name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone" VARCHAR(32) NOT NULL,
  "check_in" DATE,
  "check_out" DATE,
  "adults" INTEGER NOT NULL DEFAULT 2,
  "rooms" INTEGER NOT NULL DEFAULT 1,
  "message" TEXT NOT NULL DEFAULT '',
  "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enquiries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "enquiries_property_id_created_at_idx" ON "enquiries"("property_id", "created_at");
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");
