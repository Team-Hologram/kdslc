-- ============================================================
-- Create Product Images Storage Bucket
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public buckets can serve images by public URL without a broad SELECT
-- policy on storage.objects. Drop the old policy so clients cannot list
-- all file metadata in the bucket.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Note: We do NOT need INSERT/UPDATE/DELETE policies here because
-- our admin backend uses the `service_role` key, which bypasses RLS
-- and has full access to upload and delete files securely.
--
-- After this bucket exists, run this once locally to move the seeded
-- product images from /public into Supabase Storage and update products:
--   npm run storage:migrate-products
--
-- Product images are stored under:
--   product-images/seed-products/{product_id}/{file_name}
-- If any older uploads created root folders like product-images/tee-001,
-- run:
--   npm run storage:normalize-product-folders
