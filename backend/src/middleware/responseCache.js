const cacheStore = new Map();

function nowMs() {
  return Date.now();
}

function pruneExpired() {
  const now = nowMs();
  for (const [key, value] of cacheStore.entries()) {
    if (!value || value.expiresAt <= now) cacheStore.delete(key);
  }
}

function defaultCacheControl(ttlSeconds) {
  const maxAge = Math.max(1, Number(ttlSeconds) || 60);
  const swr = Math.max(30, maxAge * 2);
  return `public, max-age=${maxAge}, stale-while-revalidate=${swr}`;
}

export function cacheGet({ ttlSeconds = 60, cacheControl } = {}) {
  const ttlMs = Math.max(1, Number(ttlSeconds) || 60) * 1000;
  const headerValue = cacheControl || defaultCacheControl(ttlSeconds);

  return (req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.headers["cache-control"] && String(req.headers["cache-control"]).includes("no-cache")) {
      return next();
    }

    pruneExpired();
    const key = req.originalUrl || req.url;
    const hit = cacheStore.get(key);

    if (hit && hit.expiresAt > nowMs()) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", headerValue);
      return res.status(hit.statusCode).json(hit.payload);
    }

    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", headerValue);
    const originalJson = res.json.bind(res);

    res.json = (payload) => {
      const statusCode = Number(res.statusCode || 200);
      if (statusCode >= 200 && statusCode < 300) {
        cacheStore.set(key, {
          statusCode,
          payload,
          expiresAt: nowMs() + ttlMs
        });
      }
      return originalJson(payload);
    };

    return next();
  };
}

export function invalidateCacheByPrefix(prefixes = []) {
  if (!Array.isArray(prefixes) || prefixes.length === 0) return 0;
  let removed = 0;
  for (const key of Array.from(cacheStore.keys())) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      cacheStore.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export function withCacheInvalidation(handler, prefixes = []) {
  return async (req, res, next) => {
    await handler(req, res, next);
    invalidateCacheByPrefix(prefixes);
  };
}

