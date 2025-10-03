-- Find user ID for eloka@rhood.io
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles 
WHERE email = 'eloka@rhood.io';

-- Also check if there are multiple users with similar emails
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles 
WHERE email LIKE '%eloka%';

-- Check if there are any connections for this user
SELECT 
    'connections_for_eloka' as info,
    follower_id,
    following_id,
    created_at
FROM connections 
WHERE follower_id IN (
    SELECT id FROM user_profiles WHERE email = 'eloka@rhood.io'
) OR following_id IN (
    SELECT id FROM user_profiles WHERE email = 'eloka@rhood.io'
);
