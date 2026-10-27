-- ROOMO mobile verification, message audit, and per-owner commission tracking.
-- Additive only: no existing owner, guest, property, or reservation rows are deleted.

ALTER TABLE "owners"
  ADD COLUMN "phone_number" TEXT,
  ADD COLUMN "phone_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "phone_verified_at" TIMESTAMP(3),
  ADD COLUMN "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10.00;

CREATE UNIQUE INDEX "owners_phone_number_key" ON "owners"("phone_number");

ALTER TABLE "guest_users"
  ADD COLUMN "phone_number" TEXT,
  ADD COLUMN "phone_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "phone_verified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "guest_users_phone_number_key" ON "guest_users"("phone_number");

ALTER TABLE "reservations"
  ADD COLUMN "commission_rate_snapshot" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "owner_payout_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "commission_status" TEXT NOT NULL DEFAULT 'DUE',
  ADD COLUMN "commission_paid_at" TIMESTAMP(3),
  ADD COLUMN "commission_notes" TEXT;

-- Backfill existing reservations at the platform's initial default rate (10%).
UPDATE "reservations"
SET "commission_amount" = ROUND("total_amount" * 0.10, 2),
    "owner_payout_amount" = "total_amount" - ROUND("total_amount" * 0.10, 2);

CREATE TABLE "mobile_otps" (
  "id" UUID NOT NULL,
  "account_type" TEXT NOT NULL,
  "account_id" UUID NOT NULL,
  "phone_number" TEXT NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumed_at" TIMESTAMP(3),
  "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mobile_otps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mobile_otps_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 10)
);
CREATE INDEX "mobile_otps_account_type_account_id_created_at_idx" ON "mobile_otps"("account_type", "account_id", "created_at");
CREATE INDEX "mobile_otps_phone_number_created_at_idx" ON "mobile_otps"("phone_number", "created_at");

CREATE TABLE "notification_logs" (
  "id" UUID NOT NULL,
  "reservation_id" UUID NOT NULL,
  "channel" TEXT NOT NULL,
  "recipient_type" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "message_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider_message_id" TEXT,
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notification_logs_reservation_id_created_at_idx" ON "notification_logs"("reservation_id", "created_at");
CREATE INDEX "notification_logs_status_created_at_idx" ON "notification_logs"("status", "created_at");
ALTER TABLE "notification_logs"
  ADD CONSTRAINT "notification_logs_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
