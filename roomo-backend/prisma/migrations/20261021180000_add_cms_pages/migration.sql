CREATE TABLE "cms_pages" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "draft" JSONB NOT NULL,
  "published" JSONB,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");
CREATE INDEX "cms_pages_is_published_updated_at_idx" ON "cms_pages"("is_published", "updated_at");
