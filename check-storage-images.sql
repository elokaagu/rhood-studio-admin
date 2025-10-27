-- Check for images in Supabase Storage
-- This checks the storage.objects table which lists all files in buckets

SELECT 
    name as file_name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'mixes'
    AND name LIKE '%.jpg' 
    OR name LIKE '%.jpeg' 
    OR name LIKE '%.png' 
    OR name LIKE '%.webp'
    OR name LIKE '%.gif'
ORDER BY created_at DESC;

-- Also check all files in the mixes bucket
SELECT 
    name as file_name,
    bucket_id,
    created_at,
    updated_at
FROM storage.objects
WHERE bucket_id = 'mixes'
ORDER BY created_at DESC;

