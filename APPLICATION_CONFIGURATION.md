# Application Window Configuration

Application access is controlled by the backend and defaults to closed.

Set these server environment variables when a cohort opens:

```env
APPLICATIONS_OPEN=true
APPLICATION_CLOSE_AT=2026-09-30T23:59:59+00:00
PUBLIC_SECTOR_FORM_URL=https://example.org/public-form.pdf
PRIVATE_SECTOR_FORM_URL=https://example.org/private-form.pdf
PUBLIC_SECTOR_SUBMIT_URL=https://example.org/public-submit
PRIVATE_SECTOR_SUBMIT_URL=https://example.org/private-submit
```

When `APPLICATIONS_OPEN=false`, when the variable is missing, or when `APPLICATION_CLOSE_AT` has passed, the website displays **Applications are closed** and disables both form-download and submission buttons.

Email verification is not part of the current login flow. If an older deployment still displays an email-verification message, redeploy the current frontend and backend and clear the previous deployment/browser cache.

The testimonial cards and fellow-gallery slots intentionally contain neutral placeholders. Replace them only with approved, verified fellow quotes and approved photos; do not publish invented testimonials.
