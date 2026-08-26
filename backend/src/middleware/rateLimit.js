const buckets = new Map();

export function rateLimit({ windowMs, max, key = (req) => req.ip, label = "request" }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = `${label}:${key(req)}`;
    let record = buckets.get(bucketKey);
    if (!record || now - record.started >= windowMs) record = { count: 0, started: now };
    record.count += 1;
    buckets.set(bucketKey, record);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - record.count)));
    if (record.count > max) return res.status(429).json({ error: "Too many requests. Please try again later." });
    next();
  };
}

export const apiLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 120), label: "api" });
export const aiLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 10), label: "ai" });
export const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: Number(process.env.LOGIN_RATE_LIMIT || 8), label: "login", key: (req) => `${req.ip}:${String(req.body?.name || req.body?.email || "").trim().toLowerCase()}` });
export const signupLimiter = rateLimit({ windowMs: 60 * 60_000, max: Number(process.env.SIGNUP_RATE_LIMIT_PER_HOUR || 5), label: "signup" });
export const uploadLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.UPLOAD_RATE_LIMIT_PER_MINUTE || 20), label: "upload" });
