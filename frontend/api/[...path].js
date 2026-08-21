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

function backendOrigin() {
  const value = String(process.env.BACKEND_URL || "").trim().replace(/\/+$/, "");

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
  try {
    const origin = backendOrigin();
    const incoming = new URL(req.url || "/api", "https://frontend.invalid");
    const target = new URL(`${incoming.pathname}${incoming.search}`, origin);

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers || {})) {
      const lower = name.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lower) || lower === "host" || value == null) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }

    // The browser talks only to this same-origin function. The backend receives
    // the original frontend Origin for its existing origin/CSRF checks.
    if (!headers.has("origin") && req.headers?.host) {
      headers.set("origin", `https://${req.headers.host}`);
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: requestBody(req),
      redirect: "manual",
    });

    res.status(upstream.status);

    for (const [name, value] of upstream.headers.entries()) {
      const lower = name.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lower) || lower === "set-cookie") continue;
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

    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error("[api-proxy] request_failed", error);
    return res.status(502).json({
      error: "Backend service is temporarily unavailable.",
    });
  }
}
