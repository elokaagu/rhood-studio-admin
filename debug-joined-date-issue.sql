-- Debug the "Joined Invalid Date" issue
-- Check what's actually in the created_at field for members

-- Check the current created_at values for all members
SELECT 
    id,
    first_name,
    last_name,
    email,
    created_at,
    CASE 
        WHEN created_at IS NULL THEN 'NULL'
        WHEN created_at::text = '' THEN 'EMPTY STRING'
        WHEN created_at::text = 'Invalid Date' THEN 'INVALID DATE STRING'
        ELSE 'HAS VALUE: ' || created_at::text
    END as created_at_status,
    updated_at
FROM user_profiles 
ORDER BY created_at DESC;

-- Check if there are any members with problematic created_at values
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
    COUNT(CASE WHEN created_at::text = '' THEN 1 END) as empty_created_at,
    COUNT(CASE WHEN created_at IS NOT NULL AND created_at::text != '' THEN 1 END) as valid_created_at
FROM user_profiles;

-- Show sample of problematic records
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
ORDER BY updated_at DESC
LIMIT 5;
