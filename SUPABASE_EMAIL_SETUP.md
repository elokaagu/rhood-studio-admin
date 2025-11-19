# Supabase Email Template Configuration

## Customizing Signup Confirmation Emails

To make signup confirmation emails appear as coming from "R/HOOD" instead of "Supabase Auth", you need to customize the email templates in your Supabase Dashboard.

### Steps:

1. **Access Supabase Dashboard**

   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Email Templates**

   - In the left sidebar, click **Authentication**
   - Click on **Email Templates** tab

3. **Customize the "Confirm Your Signup" Template**

   - Find the **"Confirm your signup"** template
   - Update the following:
     - **Subject**: Customize to match your brand (e.g., "Confirm your R/HOOD account")
     - **Body**: Update the email content to include R/HOOD branding
     - **Sender Name**: Change from "Supabase Auth" to "R/HOOD"

4. **Configure SMTP Settings (Optional but Recommended)**

   - Go to **Authentication** > **Settings** > **SMTP Settings**
   - Configure custom SMTP if you want emails to come from your own domain
   - Set **Sender Email** to your verified domain (e.g., `noreply@rhood.io` or `info@rhood.io`)
   - Set **Sender Name** to "R/HOOD"

5. **Test the Configuration**
   - Create a test account to verify the email appears correctly
   - Check that the sender shows as "R/HOOD" instead of "Supabase Auth"

### Email Template Variables

You can use these variables in your email templates:

- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

### Example Custom Template

**Subject:**

```
Confirm your R/HOOD Portal account
```

**Body (HTML):**

```html
<h2>Welcome to R/HOOD!</h2>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>
  If you didn't sign up for R/HOOD Portal, you can safely ignore this email.
</p>
```

**Body (Plain Text):**

```
Welcome to R/HOOD!

Click the link below to confirm your account:
{{ .ConfirmationURL }}

If you didn't sign up for R/HOOD Portal, you can safely ignore this email.
```

### Additional Email Templates

You may also want to customize:

- **Magic Link** - For passwordless authentication
- **Change Email Address** - When users update their email
- **Reset Password** - For password resets
- **Invite User** - For team invitations

### Notes

- Email template changes take effect immediately
- If using custom SMTP, ensure your domain is verified
- Test emails in both HTML and plain text formats
- The sender name and email are configured in SMTP Settings, not in the template itself
