-- Set proper mix artwork using images from the public folder
-- This will replace Unsplash URLs with actual mix artwork

-- Update each mix with appropriate artwork from your public folder
UPDATE mixes 
SET image_url = '/club-residency.jpg' 
WHERE title = 'Soulection 702';

UPDATE mixes 
SET image_url = '/rooftop-sessions.jpg' 
WHERE title = 'Summer House Vibes';

UPDATE mixes 
SET image_url = '/warehouse-rave.jpg' 
WHERE title = 'Drum & Bass Energy';

UPDATE mixes 
SET image_url = '/neon-club.jpg' 
WHERE title = 'Deep House Journey';

-- Verify the updates
SELECT 
    id,
    title,
    artist,
    image_url,
    status,
    duration
FROM mixes 
ORDER BY created_at DESC;

-- Show which images are being used
SELECT 
    title,
    artist,
    image_url,
    CASE 
        WHEN image_url = '/club-residency.jpg' THEN 'Club Residency Image'
        WHEN image_url = '/rooftop-sessions.jpg' THEN 'Rooftop Sessions Image'
        WHEN image_url = '/warehouse-rave.jpg' THEN 'Warehouse Rave Image'
        WHEN image_url = '/neon-club.jpg' THEN 'Neon Club Image'
        WHEN image_url LIKE '%unsplash%' THEN 'Still has Unsplash placeholder'
        WHEN image_url IS NULL THEN 'No artwork (will show music icon)'
        ELSE 'Custom artwork'
    END as artwork_description
FROM mixes 
ORDER BY created_at DESC;
