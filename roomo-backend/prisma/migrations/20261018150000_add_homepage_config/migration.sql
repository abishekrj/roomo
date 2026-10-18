CREATE TABLE "homepage_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "draft" JSONB,
  "published" JSONB,
  "published_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "homepage_config_pkey" PRIMARY KEY ("id")
);
