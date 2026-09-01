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
  // Let undici negotiate its own encoding with the backend. Forwarding the
  // browser's value (Android Chrome advertises zstd, desktop does not) makes
  // the upstream encoding vary per device.
  "accept-encoding",
]);

// fetch() has already decompressed the upstream body by the time we read it,
// so forwarding content-encoding tells the browser to decompress plain JSON a
// second time. content-length is equally stale.
const RESPONSE_HEADERS_TO_DROP = new Set([
  ...HOP_BY_HOP_HEADERS,
  "set-cookie",
  "content-length",
  "content-encoding",
]);

function backendOrigin() {
  const value = String(process.env.BACKEND_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!value) {
    throw new Error("BACKEND_URL is not configured.");
  }

  const url = new URL(value);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BACKEND_URL must use HTTPS in production.");
  }

  return url.origin;
}

function normalizeApiPath(value) {
  const raw = Array.isArray(value) ? value.join("/") : String(value || "");
  const clean = raw
    .replace(/^\/+/, "")
    .replace(/^api\//, "")
    .replace(/[^A-Za-z0-9._~!$&'()*+,;=:@\-/]/g, "");

  if (!clean || clean.includes("..")) {
    throw new Error("Invalid API path.");
  }

  return `/api/${clean}`;
}

function requestBody(req) {
  if (["GET", "HEAD"].includes(req.method || "GET")) return undefined;
  if (req.body == null) return undefined;
  if (Buffer.isBuffer(req.body) || typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  const apiPath = normalizeApiPath(req.query?.path);
  const isAiRequest = apiPath.startsWith("/api/ai");
  const timeoutMs = isAiRequest ? 45_000 : 20_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const origin = backendOrigin();

    const forwardedUrl = new URL(apiPath, origin);
    const originalUrl = new URL(req.url || "/api/proxy", "https://frontend.invalid");

    // Preserve ordinary query parameters but never forward the internal path parameter.
    for (const [key, value] of originalUrl.searchParams.entries()) {
      if (key !== "path") forwardedUrl.searchParams.append(key, value);
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers || {})) {
      const lower = name.toLowerCase();
      if (REQUEST_HEADERS_TO_DROP.has(lower) || value == null) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }

    // This hop is server-to-server. The browser's Cookie header is preserved,
    // while browser Origin/Host headers are intentionally not forwarded.
    headers.set("x-forwarded-proto", "https");
    if (req.headers?.host) headers.set("x-forwarded-host", String(req.headers.host));

    const body = requestBody(req);
    if (body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const upstream = await fetch(forwardedUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal,
    });

    res.status(upstream.status);
    res.setHeader("Cache-Control", "no-store");

    for (const [name, value] of upstream.headers.entries()) {
      if (RESPONSE_HEADERS_TO_DROP.has(name.toLowerCase())) continue;
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

    const isEventStream = String(upstream.headers.get("content-type") || "").includes("text/event-stream");

    if (isEventStream && upstream.body) {
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } finally {
        res.end();
      }
      return;
    }

    const payload = Buffer.from(await upstream.arrayBuffer());
    return res.send(payload);
  } catch (error) {
    const reason = error?.name === "AbortError" ? "timeout" : error?.message || "unknown";
    console.error(`[api-proxy] request_failed method=${req.method} reason=${reason}`);
    return res.status(502).json({
      error: "Backend service is temporarily unavailable.",
    });
  } finally {
    clearTimeout(timeout);
  }
}