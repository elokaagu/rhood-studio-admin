-- Fix "Joined Invalid Date" issue by setting proper created_at values
-- This will set created_at to updated_at for members who have NULL or empty created_at

-- First, check the current state
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
    COUNT(CASE WHEN created_at::text = '' THEN 1 END) as empty_created_at,
    COUNT(CASE WHEN created_at IS NOT NULL AND created_at::text != '' THEN 1 END) as valid_created_at
FROM user_profiles;

-- Show members with problematic created_at
SELECT 
    id,
    first_name,
    last_name,
    email,
    created_at,
    updated_at
FROM user_profiles 
WHERE created_at IS NULL 
   OR created_at::text = ''
ORDER BY updated_at DESC;

-- Fix the issue by setting created_at to updated_at for problematic records
UPDATE user_profiles 
SET created_at = updated_at 
WHERE created_at IS NULL 
   OR created_at::text = '';

-- Alternative: Set created_at to a default date if updated_at is also problematic
UPDATE user_profiles 
SET created_at = NOW() - INTERVAL '30 days'
WHERE created_at IS NULL 
   OR created_at::text = ''
   OR updated_at IS NULL 
   OR updated_at::text = '';

-- Verify the fix
SELECT 
    id,
    first_name,
    last_name,
    email,
    created_at,
    updated_at,
    CASE 
        WHEN created_at IS NULL THEN 'STILL NULL'
        WHEN created_at::text = '' THEN 'STILL EMPTY'
        ELSE 'FIXED: ' || created_at::text
    END as status
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;
