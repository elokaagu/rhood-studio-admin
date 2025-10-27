-- Script to update mix image URLs if images exist in storage
-- First, run this to see what's in storage and what's missing in the database

-- Check if there are any image files in the mixes storage bucket
-- Note: You'll need to check the Storage section of Supabase dashboard manually
-- for the 'mixes' bucket to see if artwork folders exist

-- To manually add image URLs to mixes that are missing them:
-- Replace the mix_id and image_url below with actual values

UPDATE mixes 
SET image_url = 'https://your-supabase-project.supabase.co/storage/v1/object/public/mixes/artwork/your-image.jpg'
WHERE id = 'your-mix-id-here'
AND image_url IS NULL;

-- Example update (modify the URL and ID):
-- UPDATE mixes 
-- SET image_url = 'https://jsmcduecuxtaqizhmiqo.supabase.co/storage/v1/object/public/mixes/artwork/filename.jpg'
-- WHERE id = '2e012d4e-6103-47d4-a2d2-f6d2bff70184';
--
-- UPDATE mixes 
-- SET image_url = 'https://jsmcduecuxtaqizhmiqo.supabase.co/storage/v1/object/public/mixes/artwork/filename.jpg'
-- WHERE id = '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d';

-- After updating, verify:
SELECT id, title, image_url FROM mixes WHERE id IN (
    '2e012d4e-6103-47d4-a2d2-f6d2bff70184',
    '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d'
);

