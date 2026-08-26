import cors from "cors";
import { isProduction, sessionCookie } from "./env.js";

export const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",").map((value) => value.trim().replace(/\/$/, "")).filter(Boolean);

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction && allowedOrigins.some((o) => !/^https?:\/\/localhost(?::\d+)?$/i.test(o)) ? "none" : "lax",
  path: "/",
};

export function corsMiddleware() {
  return cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      return allowedOrigins.includes(normalized)
        ? callback(null, true)
        : callback(new Error("Origin not allowed by CORS"));
    },
  });
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  next();
}

export function csrfOriginGuard(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin.replace(/\/$/, ""))) {
    return res.status(403).json({ error: "Request origin rejected." });
  }
  next();
}

export { sessionCookie };
