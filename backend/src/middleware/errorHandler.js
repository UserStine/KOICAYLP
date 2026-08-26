export function notFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[api] error method=${req.method} path=${req.path} ip=${req.ip} message=${String(err?.message || err).slice(0, 500)}`);
  if (res.headersSent) return;
  res.status(err?.status || 500).json({ error: err?.publicMessage || "Internal server error." });
}
