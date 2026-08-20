# Security deployment requirements

1. Deploy the backend only behind HTTPS and a trusted reverse proxy. Production rejects non-HTTPS requests and sends HSTS.
2. Store `YLP_SECRET`, `OPENAI_API_KEY`, mail credentials, and infrastructure secrets in the hosting provider's secret manager. Never use `VITE_` for secrets because Vite embeds those values in frontend JavaScript.
4. Keep the data store/database on a private network. Do not expose database ports to the public internet. Permit access only from the backend runtime and administrative network.
5. Forward application logs to centralized logging with alerts for `login_failed`, `rate_limit`, `csrf_origin_rejected`, API 5xx errors, and AI upstream failures. Do not log passwords, PINs, session cookies, reset tokens or API keys.
6. Rotate every legacy KOICA PIN before production. The original repository contained plaintext PINs and therefore those credentials must be considered compromised.
7. Purge plaintext credentials from Git history before pushing the secured project to a shared or public remote. This secured deliverable intentionally excludes the original `.git` directory.
7. Configure the transactional mail webhook before enabling password reset in production. Reset tokens expire after `AUTH_TOKEN_TTL_MINUTES` and are stored only as SHA-256 digests.
9. Put an edge/WAF rate limit in front of the Node rate limits for distributed attacks. Application-level limits remain a second layer.
10. Replace the JSON file store with a transactional database before multi-instance production deployment; then enforce ownership predicates in each query (for example `WHERE id = ? AND user_id = ?`) and keep the database private.
