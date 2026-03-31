const buckets = new Map();

function now() {
  return Date.now();
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || "unknown";
}

function getBucket(key, windowMs) {
  const current = buckets.get(key);
  const ts = now();
  if (!current || current.resetAt <= ts) {
    const fresh = { count: 0, resetAt: ts + windowMs };
    buckets.set(key, fresh);
    return fresh;
  }
  return current;
}

function pruneBuckets() {
  const ts = now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= ts) buckets.delete(key);
  }
}

setInterval(pruneBuckets, 60_000).unref();

export function createRateLimiter({
  keyPrefix = "global",
  windowMs = 10 * 60 * 1000,
  max = 30,
  message = "Shume kerkesa per momentin. Provo perseri pas pak."
} = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const bucket = getBucket(key, windowMs);
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now()) / 1000));

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message
      });
    }

    return next();
  };
}

