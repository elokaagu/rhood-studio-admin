-- Debug script to check mix artwork URLs
-- Run this in Supabase SQL Editor to see what's causing the artwork display issue

-- Check all mixes and their image_url values
SELECT 
  id,
  title,
  artist,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    WHEN image_url = '' THEN 'EMPTY STRING'
    ELSE 'HAS URL: ' || image_url
  END as image_status,
  created_at,
  status
FROM mixes 
ORDER BY created_at DESC;

-- Specifically check for "Soulection 702" mix
SELECT 
  id,
  title,
  artist,
  image_url,
  file_url,
  description,
  created_at,
  status
FROM mixes 
WHERE title ILIKE '%soulection%' 
   OR title ILIKE '%702%'
   OR artist ILIKE '%eloka%';

-- Check if the mixes table has the expected schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count mixes by image_url status
SELECT 
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    WHEN image_url = '' THEN 'EMPTY'
    ELSE 'HAS_URL'
  END as image_status,
  COUNT(*) as count
FROM mixes 
GROUP BY 
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    WHEN image_url = '' THEN 'EMPTY'
    ELSE 'HAS_URL'
  END;
