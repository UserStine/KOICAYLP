const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const REQUEST_HEADERS_TO_DROP = new Set([
  ...HOP_BY_HOP_HEADERS,
  "host",
  "origin",
  "referer",
  "content-length",
  "content-encoding",
]);

function backendOrigin() {
  const value = String(process.env.BACKEND_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!value) {
    throw new Error("BACKEND_URL is not configured for the frontend deployment.");
  }

  const url = new URL(value);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BACKEND_URL must use HTTPS in production.");
  }

  return url.origin;
}

function requestBody(req) {
  if (["GET", "HEAD"].includes(req.method || "GET")) return undefined;
  if (req.body == null) return undefined;
  if (Buffer.isBuffer(req.body) || typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
}

export default async function handler(req, res) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const origin = backendOrigin();
    const incoming = new URL(req.url || "/api", "https://frontend.invalid");
    const target = new URL(`${incoming.pathname}${incoming.search}`, origin);

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers || {})) {
      const lower = name.toLowerCase();
      if (REQUEST_HEADERS_TO_DROP.has(lower) || value == null) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }

    // The browser already made a same-origin request to this Vercel function.
    // From here to the backend this is server-to-server traffic, so do not
    // forward the browser Origin. This avoids CORS/CSRF mismatches while the
    // first-party SameSite=Lax cookie still protects authenticated requests.
    headers.set("x-forwarded-proto", "https");
    if (req.headers?.host) headers.set("x-forwarded-host", String(req.headers.host));

    const body = requestBody(req);
    if (body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal,
    });

    res.status(upstream.status);
    res.setHeader("Cache-Control", "no-store");

    for (const [name, value] of upstream.headers.entries()) {
      const lower = name.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lower) || lower === "set-cookie" || lower === "content-length") continue;
      res.setHeader(name, value);
    }

    const cookies = typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];

    if (cookies.length) {
      res.setHeader("Set-Cookie", cookies);
    } else {
      const cookie = upstream.headers.get("set-cookie");
      if (cookie) res.setHeader("Set-Cookie", cookie);
    }

    const bodyBuffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(bodyBuffer);
  } catch (error) {
    const reason = error?.name === "AbortError" ? "timeout" : error?.message || "unknown";
    console.error(`[api-proxy] request_failed reason=${reason}`);
    return res.status(502).json({
      error: "Backend service is temporarily unavailable.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
