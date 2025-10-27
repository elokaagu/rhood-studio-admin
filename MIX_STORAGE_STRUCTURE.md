# Mix Storage Structure

## New Organization System

Mixes are now organized by their unique ID in Supabase Storage to ensure proper association between mix metadata and artwork.

### Storage Path Structure

```
mixes/
├── {mix-id-1}/
│   ├── audio.mp3
│   └── artwork.jpg
├── {mix-id-2}/
│   ├── audio.wav
│   └── artwork.png
└── {mix-id-3}/
    ├── audio.m4a
    └── artwork.webp
```

### Benefits

1. **Clear Association**: Each mix has its own folder named with the mix's unique ID
2. **No Lost Images**: Images are always properly linked to their mix via the database `image_url` field
3. **Consistent Naming**:
   - Audio files: `{mix-id}/audio.{extension}`
   - Artwork files: `{mix-id}/artwork.{extension}`
4. **Easy Management**: You can easily find or delete all files for a specific mix

### Upload Process

When uploading a new mix:

1. **Mix record is created first** in the database to get its unique ID
2. **Audio file is uploaded** to path: `{mix-id}/audio.{ext}`
3. **Image file is uploaded** (if provided) to path: `{mix-id}/artwork.{ext}`
4. **Database is updated** with the full public URLs for both files

This ensures:

- Every mix always has its `image_url` saved in the database
- Files are never "lost" in storage
- Easy cleanup if a mix needs to be deleted

### Migrating Old Mixes

For existing mixes that have images in the old random structure, you'll need to:

1. Find the mix's image in storage
2. Get the public URL using the "Get URL" button in Supabase Storage
3. Update the database with the correct URL:

```sql
UPDATE mixes
SET image_url = 'YOUR_FULL_PUBLIC_URL_HERE'
WHERE id = 'mix-id-here';
```

### Future Uploads

All new uploads will automatically:

- ✅ Save images with the mix ID
- ✅ Store the image URL in the database
- ✅ Display properly in the admin panel
