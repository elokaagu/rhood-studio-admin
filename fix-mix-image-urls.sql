-- Fix mix image URLs based on actual storage locations
-- IMPORTANT: Click "Get URL" on each image in Supabase Storage and paste the URLs below

-- Step 1: Get the URLs from Supabase Storage
-- Click each artwork file and use the "Get URL" button to get the full public URL

-- Step 2: Update the database with the correct URLs
-- INSTRUCTIONS: 
-- 1. Go to Storage in Supabase Dashboard
-- 2. Find the artwork files in the dfee6a12-a337-46f9-8bf0-307b4262f60f folder
-- 3. Click on each artwork file
-- 4. Click "Get URL" button 
-- 5. Copy the full public URL
-- 6. Paste it below to replace the REPLACE_WITH_* placeholders
-- 7. Run this SQL

-- For "Soulection 700" by Eloka (this should be artwork_1760924784112.jpg)
UPDATE mixes 
SET image_url = 'REPLACE_WITH_SOULECTION_700_IMAGE_URL_HERE'
WHERE id = '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d';

-- For "Tarzsa NTS" by DJ MORITA (find the corresponding artwork file)
UPDATE mixes 
SET image_url = 'REPLACE_WITH_TARZSA_NTS_IMAGE_URL_HERE'
WHERE id = '2e012d4e-6103-47d4-a2d2-f6d2bff70184';

-- After updating, verify:
SELECT id, title, artist, image_url FROM mixes WHERE id IN (
    '2e012d4e-6103-47d4-a2d2-f6d2bff70184',
    '8ebf6c28-41ba-4dbf-a8d9-18c96a3e490d'
);

