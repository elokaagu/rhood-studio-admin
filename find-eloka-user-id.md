# Find Eloka's User ID

To get the actual user ID for eloka@rhood.io, you have a few options:

## Option 1: Check Supabase SQL Editor

Run this query in your Supabase SQL Editor:

```sql
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'eloka@rhood.io';
```

## Option 2: Browser Console Method

If you're already logged in as eloka@rhood.io in your web app, run this in the browser console:

```javascript
// Get current user ID
supabase.auth.getUser().then(({ data, error }) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Current User ID:", data.user?.id);
    console.log("Current User Email:", data.user?.email);
  }
});
```

## Option 3: Sign In and Get ID

If you need to sign in first, run this in the browser console:

```javascript
supabase.auth
  .signInWithPassword({
    email: "eloka@rhood.io",
    password: "Honour18!!",
  })
  .then(({ data, error }) => {
    if (error) {
      console.error("Sign in error:", error);
    } else {
      console.log("✅ Signed in successfully!");
      console.log("User ID:", data.user?.id);
      console.log("User Email:", data.user?.email);
    }
  });
```

## Option 4: Check All Users

To see all users in your system:

```sql
SELECT
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

## Next Steps

Once you have the user ID:

1. **Copy the ID** from the results
2. **Replace `YOUR_USER_ID_HERE`** in `create-eloka-profile.sql`
3. **Run the INSERT statement** to create the profile

---

**Note:** If the user doesn't exist yet, you'll need to create them first in:

- Supabase Dashboard → Authentication → Users → Add User
- Email: `eloka@rhood.io`
- Password: `Honour18!!`
