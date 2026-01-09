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

4. **Configure SMTP Settings (Required for Custom Sender)**

   - Go to **Authentication** > **Settings** > **SMTP Settings**
   - Enable **Custom SMTP** (if not already enabled)
   - Configure your SMTP provider (e.g., Resend, SendGrid, AWS SES, etc.)
   - Set **Sender Email** to: `hello@rhood.io`
   - Set **Sender Name** to: "R/HOOD"
   - **Important**: You must verify the domain `rhood.io` with your SMTP provider before emails can be sent from `hello@rhood.io`

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
- **SMTP Configuration is Required**: To send emails from `hello@rhood.io`, you MUST configure custom SMTP in Supabase
- **Domain Verification**: The domain `rhood.io` must be verified with your SMTP provider (e.g., Resend, SendGrid)
- Without custom SMTP, emails will continue to come from Supabase's default sender
- Test emails in both HTML and plain text formats
- The sender name and email are configured in SMTP Settings, not in the template itself

### Quick Setup for hello@rhood.io

1. **Verify Domain in Your SMTP Provider**:
   - Add DNS records (SPF, DKIM, DMARC) for `rhood.io` domain
   - Wait for verification (usually takes a few minutes to 24 hours)

2. **Configure in Supabase**:
   - Go to **Authentication** > **Settings** > **SMTP Settings**
   - Enable **Custom SMTP**
   - Enter your SMTP credentials
   - Set **Sender Email**: `hello@rhood.io`
   - Set **Sender Name**: `R/HOOD`
   - Save settings

3. **Test**:
   - Create a test account to verify emails come from `hello@rhood.io`
