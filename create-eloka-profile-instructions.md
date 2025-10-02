# Create Eloka Profile - Browser Console Method

Since you need to create a profile for eloka@rhood.io, here are the steps:

## Step 1: Create the Auth User (if not exists)

First, you need to create the user in Supabase Auth. You can do this by:

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Users**
3. **Click "Add User"**
4. **Fill in:**
   - Email: `eloka@rhood.io`
   - Password: `Honour18!!`
   - Email Confirm: `true` (check this box)

## Step 2: Get the User ID

After creating the auth user, run this in your browser console to get the user ID:

```javascript
// First, sign in as eloka@rhood.io to get the user ID
supabase.auth
  .signInWithPassword({
    email: "eloka@rhood.io",
    password: "Honour18!!",
  })
  .then(async (authResult) => {
    if (authResult.error) {
      console.error("Sign in error:", authResult.error);
      return;
    }

    const userId = authResult.data.user?.id;
    console.log("Eloka User ID:", userId);

    // Now create the profile
    const { data, error } = await supabase.from("user_profiles").upsert({
      id: userId,
      first_name: "Eloka",
      last_name: "Agu",
      dj_name: "Eloka Agu",
      email: "eloka@rhood.io",
      city: "Studio",
      bio: "Rhood Studio Super Administrator - Managing all studio operations, opportunities, and community features.",
      genres: ["Admin", "Studio Management", "Super Admin"],
      instagram: "https://instagram.com/elokaagu",
      soundcloud: "https://soundcloud.com/elokaagu",
    });

    if (error) {
      console.error("Error creating profile:", error);
    } else {
      console.log("✅ Eloka profile created successfully!");
      console.log("Profile data:", data);
    }
  });
```

## Step 3: Alternative - Direct SQL Method

If you prefer to use SQL directly, use the `create-eloka-profile.sql` file:

1. **Run the first SELECT query** to check if the user exists in auth.users
2. **Copy the user ID** from the results
3. **Replace `YOUR_USER_ID_HERE`** in the INSERT statement with the actual ID
4. **Run the INSERT statement**

## Step 4: Verify Profile Creation

After creating the profile, verify it was created successfully:

```javascript
// Check if the profile exists
supabase
  .from("user_profiles")
  .select("*")
  .eq("email", "eloka@rhood.io")
  .then(({ data, error }) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Eloka profile:", data);
    }
  });
```

## Step 5: Test Community Creation

Once the profile is created, try creating a community - it should work perfectly!

---

**Note:** The password `Honour18!!` is only used for the initial auth user creation. The profile creation is separate from the password.
