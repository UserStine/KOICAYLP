# Participant Password Reset Setup

The participant portal keeps its existing KOICA PIN/password authentication model. Password-reset tokens are stored in Supabase when Supabase is configured; local development falls back to JSON.

## 1. Create the Supabase token table

Open Supabase Dashboard > SQL Editor and run:

`backend/sql/008_password_reset_tokens.sql`

The table stores only SHA-256 token digests. Raw reset tokens are never stored in the database.

## 2. Configure the production URL

Set the backend environment variable to the public frontend URL:

`FRONTEND_URL=https://your-public-site.example`

Reset links are generated as:

`https://your-public-site.example/reset-password?token=...`

## 3. Configure email delivery

This project already supports an email-delivery webhook. Set:

`EMAIL_DELIVERY_WEBHOOK_URL=https://your-email-service-webhook`
`EMAIL_DELIVERY_WEBHOOK_TOKEN=optional-secret`

The backend POSTs JSON in this shape:

```json
{
  "to": "participant@example.com",
  "subject": "Reset your KOICA YLP participant password",
  "text": "..."
}
```

For local development, if no delivery webhook is configured, the forgot-password response contains a development-only reset URL. Production never returns the reset token to the browser.

## Security behaviour

- Reset requests always return the same public response, whether or not the email exists.
- Tokens are cryptographically random and only their SHA-256 digests are stored.
- A new reset request invalidates older unused reset tokens for that participant.
- Tokens expire according to `AUTH_TOKEN_TTL_MINUTES` (default 15 minutes).
- Tokens are single-use.
- A successful reset replaces the participant's old PIN credential with the new password.
- Passwords are stored using the existing salted `scrypt` password hashing implementation.

## Frontend routes

- `/forgot-password`
- `/reset-password?token=...`

The login screen now accepts either the originally issued KOICA PIN or a password created through recovery.
