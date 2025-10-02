# Create User Profile from Web App

Since `auth.uid()` returns null in the SQL Editor, here's how to create your profile directly from your web app:

## Method 1: Browser Console (Easiest)

1. **Open your web app** (the communities page)
2. **Open Browser Developer Tools** (F12)
3. **Go to Console tab**
4. **Run this code:**

```javascript
// Get your user ID
supabase.auth.getUser().then(async (userResult) => {
  const userId = userResult.data.user?.id;
  console.log("Your User ID:", userId);

  if (!userId) {
    console.error("Not logged in!");
    return;
  }

  // Create your profile
  const { data, error } = await supabase.from("user_profiles").upsert({
    id: userId,
    first_name: "Studio",
    last_name: "Admin",
    dj_name: "Rhood Admin",
    email: "admin@rhood.studio",
    city: "Studio",
    bio: "Rhood Studio Administrator",
    genres: ["Admin", "Studio", "Management"],
  });

  if (error) {
    console.error("Error creating profile:", error);
  } else {
    console.log("✅ Profile created successfully!");
    console.log("You can now create communities!");
  }
});
```

## Method 2: Manual SQL (Alternative)

1. **Run the first part** of `fix-user-profile-setup.sql` to get your auth status
2. **Copy your User ID** from the web app console (Method 1)
3. **Replace `YOUR_USER_ID_HERE`** in the commented SQL with your actual ID
4. **Run the INSERT statement**

## Method 3: Create Test Profile

If you just want to test quickly, uncomment and run the "Alternative" section in `fix-user-profile-setup.sql` - this creates a profile with a random UUID.

## Verification

After creating your profile, try creating a community again - it should work!
