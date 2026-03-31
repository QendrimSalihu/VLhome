import { verifyAdminToken } from "../utils/adminToken.js";
import { unauthorized } from "../utils/httpError.js";
import { env } from "../config/env.js";

function parseCookies(cookieHeader) {
  const map = new Map();
  if (!cookieHeader || typeof cookieHeader !== "string") return map;
  cookieHeader.split(";").forEach((entry) => {
    const idx = entry.indexOf("=");
    if (idx <= 0) return;
    const key = entry.slice(0, idx).trim();
    const val = entry.slice(idx + 1).trim();
    if (!key) return;
    try {
      map.set(key, decodeURIComponent(val));
    } catch {
      map.set(key, val);
    }
  });
  return map;
}

export function requireAdminAuth(req, _res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  const cookieToken = cookies.get(env.adminCookieName) || "";
  const token = cookieToken;
  const parsed = verifyAdminToken(token);
  if (!parsed.valid) {
    return next(unauthorized("Kjo veprim kerkon login admin."));
  }
  req.admin = parsed.payload;
  return next();
}
