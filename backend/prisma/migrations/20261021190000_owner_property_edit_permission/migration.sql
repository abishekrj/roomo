-- Allow the super-admin to enable or disable owner-side property editing.
-- Existing owners default to view-only; existing rows and property data are preserved.
ALTER TABLE "owners"
ADD COLUMN IF NOT EXISTS "can_edit_properties" BOOLEAN NOT NULL DEFAULT FALSE;
