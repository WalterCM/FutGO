-- Add google_maps_url to fields table
ALTER TABLE "public"."fields" ADD COLUMN "google_maps_url" text;

-- Move existing URLs from address to google_maps_url if they look like links
UPDATE "public"."fields" 
SET "google_maps_url" = "address" 
WHERE "address" LIKE 'http%';

-- Clean up address if it was just a link
UPDATE "public"."fields"
SET "address" = 'Sede del Encuentro'
WHERE "address" LIKE 'http%';
