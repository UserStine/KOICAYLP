# Security review and remediation

## Critical findings fixed

- Removed plaintext participant PINs from API responses, admin screens, the participant JSON store, and the roster import output.
- Removed the committed plaintext roster from the secured deliverable and replaced it with a non-secret example file.
- Replaced frontend-readable bearer tokens/localStorage auth with expiring HttpOnly cookies.
- Added logout cookie invalidation, production HTTPS enforcement, HSTS, security headers, origin checks, and credential-aware CORS.
- Added login, global API, registration/password-recovery, and AI request rate limits plus suspicious-request logging.
- Added ownership/entitlement validation to progress updates so arbitrary module/lesson IDs cannot be written.
- Kept module/resource track authorization on read/download endpoints and admin role authorization on all admin endpoints.
- Added strict route-ID validation and file-content signature checks for allowed uploads.
- Added password-reset token flows. Tokens expire, are single-use, and are stored only as SHA-256 digests.
- Added server-side AI integration. `OPENAI_API_KEY` remains server-only and the frontend only calls `/api/ai/chat`.
- Added a daily calendar endpoint and portal view based on the dated programme modules.

## Important deployment actions

- Rotate every legacy PIN before production because plaintext credentials existed in the original repository and Git history.
- Purge the old credentials from any remote Git history before sharing or publishing the repository.
- Configure `YLP_SECRET`, `OPENAI_API_KEY`, and mail webhook credentials in the hosting platform secret manager.
- Keep the backend and any future database on private infrastructure; never expose a database port publicly.
- Send logs to centralized monitoring and alert on repeated login failures, rate-limit hits, origin rejections, 5xx responses, and AI upstream errors.
- Put a CDN/WAF or API gateway in front of the app for distributed bot protection; in-process rate limits are not sufficient across multiple server instances.
- Replace JSON files with a transactional database before multi-instance production use. Enforce ownership in every query with both resource ID and caller ID/role/track constraints.

## Compatibility note

Legacy roster accounts authenticate using their hashed KOICA PIN. Email verification is currently disabled and not required for login.
