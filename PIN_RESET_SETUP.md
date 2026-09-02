# KOICA PIN Reset Setup

The participant portal uses the existing roster authentication model: **Full Name + KOICA PIN**. No participant email address is required.

## 1. Run the Supabase migration

Open Supabase → SQL Editor, paste the contents of:

`backend/sql/009_pin_reset_requests.sql`

and click **Run**.

This adds `participants.must_change_pin` and creates `pin_reset_requests`.

## 2. Participant recovery flow

1. Participant selects **Forgot your KOICA PIN?** on the login page.
2. They enter full name, country, and Public/Private track.
3. The backend only creates a request when those details match the roster, but always returns the same public response to prevent account enumeration.
4. Admin opens **Admin → PIN Resets**.
5. Admin verifies the participant and approves the request.
6. A temporary PIN is generated and displayed to the admin once. It is never stored in plaintext.
7. Admin communicates that temporary PIN through an approved programme channel.
8. Participant signs in with their exact name and temporary PIN.
9. The portal forces them to set a new PIN before LMS access.

## Security notes

- Temporary PINs replace the old credential using scrypt hashing.
- Plaintext temporary PINs are not stored in Supabase or JSON.
- Only administrators can approve/reject requests.
- Only one pending request per participant is allowed in Supabase.
- After approval, `must_change_pin=true` blocks normal LMS access until the participant chooses a new PIN.
