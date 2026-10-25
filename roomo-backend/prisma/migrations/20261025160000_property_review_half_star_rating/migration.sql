-- Allow guest and admin review ratings in half-star increments.
ALTER TABLE "property_reviews"
  ALTER COLUMN "rating" TYPE DOUBLE PRECISION
  USING "rating"::DOUBLE PRECISION;
