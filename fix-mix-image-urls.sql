-- Fix mix image URLs based on actual storage locations
-- IMPORTANT: Click "Get URL" on each image in Supabase Storage and paste the URLs below

-- Step 1: Get the URLs from Supabase Storage
-- Click each artwork file and use the "Get URL" button to get the full public URL

-- Step 2: Update the database with the correct URLs
-- Replace the URLs below with the actual URLs from storage

-- For "Soulection 700" by Eloka
UPDATE mixes 
SET image_url = 'REPLACE_WITH_SOULECTION_700_IMAGE_URL'
WHERE id = '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d';

-- For "Tarzsa NTS" by DJ MORITA  
UPDATE mixes 
SET image_url = 'REPLACE_WITH_TARZSA_NTS_IMAGE_URL'
WHERE id = '2e012d4e-6103-47d4-a2d2-f6d2bff70184';

-- After updating, verify:
SELECT id, title, artist, image_url FROM mixes WHERE id IN (
    '2e012d4e-6103-47d4-a2d2-f6d2bff70184',
    '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d'
);

