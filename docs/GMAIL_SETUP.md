# Gmail API setup (Google Workspace)

DigiCard can send edit and delete confirmation emails through your `@sojern.com` Google Workspace account using the Gmail API.

Gmail is used automatically when all `GMAIL_*` variables are set. Resend remains a fallback if Gmail is not configured.

## Step 1 — Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (e.g. **Sojern DigiCard**)
3. Select that project in the top bar

## Step 2 — Enable the Gmail API

1. Go to **APIs & Services → Library**
2. Search for **Gmail API**
3. Click **Enable**

## Step 3 — Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **Internal** (recommended for Sojern Workspace — only `@sojern.com` users can authorize)
3. Fill in:
   - **App name:** `Sojern DigiCard`
   - **User support email:** your `@sojern.com` address
   - **Developer contact:** your `@sojern.com` address
4. On **Scopes**, add:
   - `https://www.googleapis.com/auth/gmail.send`
5. Save through the summary screen

> If **Internal** is not available, your Workspace admin may need to enable it, or use **External** and add your account as a test user.

## Step 4 — Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. **Create credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `DigiCard Worker`
5. **Authorized redirect URIs** — add exactly:
   ```
   http://localhost:3333/oauth2callback
   ```
6. Create, then copy the **Client ID** and **Client secret**

## Step 5 — Generate a refresh token (one time)

From the `business-card-cloud` folder:

```bash
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com" \
GMAIL_CLIENT_SECRET="your-client-secret" \
npm run gmail:setup
```

1. Open the URL printed in the terminal
2. Sign in with your `@sojern.com` account
3. Approve **Send email on your behalf**
4. Copy the `GMAIL_REFRESH_TOKEN` printed in the terminal

If you do not get a refresh token, revoke prior access at [Google Account → Security → Third-party access](https://myaccount.google.com/permissions) and run the script again.

## Step 6 — Add environment variables in Webflow Cloud

In your Webflow Cloud project settings, add:

| Variable | Example |
|----------|---------|
| `GMAIL_CLIENT_ID` | `123...apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | `GOCSPX-...` |
| `GMAIL_REFRESH_TOKEN` | `1//0g...` |
| `GMAIL_FROM_EMAIL` | `you@sojern.com` |
| `GMAIL_FROM_NAME` | `Sojern DigiCard` |

Redeploy after saving env vars.

## Step 7 — Test

1. Open **Find my card** on the DigiCard builder
2. Enter the email on a published card
3. Click **Email me an edit link**
4. Check the inbox for mail from your `GMAIL_FROM_EMAIL` address

## Notes

- **Send limits:** Google Workspace allows roughly 2,000 messages/day per user (plenty for DigiCard).
- **Security:** Treat the refresh token like a password. Store only in Webflow Cloud secrets.
- **Resend fallback:** If Gmail vars are missing, DigiCard falls back to `RESEND_API_KEY` when set.
- **Admin approval:** Some Workspace orgs require an admin to approve the OAuth app before users can authorize it.
