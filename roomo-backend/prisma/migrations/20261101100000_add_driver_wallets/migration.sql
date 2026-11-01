CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'LOW_BALANCE', 'RESTRICTED');
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "WalletTransactionCategory" AS ENUM ('RECHARGE', 'COMMISSION', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "WalletRechargeMethod" AS ENUM ('ONLINE', 'MANUAL');
CREATE TYPE "WalletRechargeStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REJECTED');
CREATE TYPE "WalletCommissionModel" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "WalletRechargeMode" AS ENUM ('ONLINE', 'MANUAL', 'BOTH');

CREATE TABLE "driver_wallets" (
  "id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  "total_recharged" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  "total_commission" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  "status" "WalletStatus" NOT NULL DEFAULT 'LOW_BALANCE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "driver_wallets_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "driver_wallets_driver_id_key" ON "driver_wallets"("driver_id");
CREATE INDEX "driver_wallets_status_balance_idx" ON "driver_wallets"("status", "balance");

CREATE TABLE "wallet_transactions" (
  "id" UUID NOT NULL,
  "wallet_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "category" "WalletTransactionCategory" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "balance_before" DECIMAL(12,2) NOT NULL,
  "balance_after" DECIMAL(12,2) NOT NULL,
  "booking_id" UUID,
  "commission_base_amount" DECIMAL(12,2),
  "commission_rate_snapshot" DECIMAL(5,2),
  "reference_id" VARCHAR(180),
  "idempotency_key" VARCHAR(180),
  "description" VARCHAR(500),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_transactions_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "driver_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_transactions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "transport_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "wallet_transactions_reference_id_key" ON "wallet_transactions"("reference_id");
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE UNIQUE INDEX "wallet_transactions_one_commission_per_booking" ON "wallet_transactions"("booking_id") WHERE "category" = 'COMMISSION' AND "booking_id" IS NOT NULL;
CREATE INDEX "wallet_transactions_driver_id_created_at_idx" ON "wallet_transactions"("driver_id", "created_at");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
CREATE INDEX "wallet_transactions_booking_id_category_idx" ON "wallet_transactions"("booking_id", "category");
CREATE INDEX "wallet_transactions_category_created_at_idx" ON "wallet_transactions"("category", "created_at");

CREATE TABLE "wallet_recharges" (
  "id" UUID NOT NULL,
  "wallet_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "WalletRechargeMethod" NOT NULL,
  "status" "WalletRechargeStatus" NOT NULL DEFAULT 'PENDING',
  "payment_provider" VARCHAR(80),
  "payment_reference" VARCHAR(180),
  "idempotency_key" VARCHAR(180),
  "approved_by" VARCHAR(180),
  "remarks" VARCHAR(1000),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "wallet_recharges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_recharges_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "wallet_recharges_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "driver_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_recharges_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "wallet_recharges_payment_reference_key" ON "wallet_recharges"("payment_reference");
CREATE UNIQUE INDEX "wallet_recharges_idempotency_key_key" ON "wallet_recharges"("idempotency_key");
CREATE INDEX "wallet_recharges_driver_id_status_created_at_idx" ON "wallet_recharges"("driver_id", "status", "created_at");
CREATE INDEX "wallet_recharges_status_created_at_idx" ON "wallet_recharges"("status", "created_at");

CREATE TABLE "wallet_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "commission_model" "WalletCommissionModel" NOT NULL DEFAULT 'PERCENTAGE',
  "commission_value" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "minimum_balance" DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  "recharge_method" "WalletRechargeMode" NOT NULL DEFAULT 'BOTH',
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_settings_singleton_id" CHECK ("id" = 'default'),
  CONSTRAINT "wallet_settings_commission_nonnegative" CHECK ("commission_value" >= 0),
  CONSTRAINT "wallet_settings_minimum_nonnegative" CHECK ("minimum_balance" >= 0)
);

-- Provision an empty wallet for every driver already registered.
INSERT INTO "driver_wallets" ("id", "driver_id", "balance", "total_recharged", "total_commission", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), d."id", 0.00, 0.00, 0.00, 'LOW_BALANCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "drivers" d
ON CONFLICT ("driver_id") DO NOTHING;

-- Insert the agreed ROOMO defaults without overwriting any existing setting.
INSERT INTO "wallet_settings" ("id", "commission_model", "commission_value", "minimum_balance", "recharge_method", "is_enabled", "updated_at")
VALUES ('default', 'PERCENTAGE', 10.00, 500.00, 'BOTH', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
