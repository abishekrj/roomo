-- Create guest accounts before applying email verification fields.
-- IF NOT EXISTS also accommodates local databases where the table was created
-- earlier with prisma db push.
CREATE TABLE IF NOT EXISTS "guest_users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'EMAIL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guest_users_email_key" ON "guest_users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "guest_users_google_id_key" ON "guest_users"("google_id");
