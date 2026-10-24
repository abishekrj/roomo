ALTER TABLE "properties"
ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featured_sort_order" INTEGER NOT NULL DEFAULT 0;
