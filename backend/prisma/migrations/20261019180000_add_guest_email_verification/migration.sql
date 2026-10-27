-- Add email verification for guest accounts.
-- Existing guest accounts remain verified; newly registered email/password users
-- are explicitly created with email_verified = false by the API.
ALTER TABLE "guest_users"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "email_verification_token_hash" TEXT,
  ADD COLUMN "email_verification_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "guest_users_email_verification_token_hash_key"
  ON "guest_users"("email_verification_token_hash");
