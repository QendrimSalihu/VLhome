import { verifyAdminToken } from "../utils/adminToken.js";
import { unauthorized } from "../utils/httpError.js";

export function requireAdminAuth(req, _res, next) {
  const raw = String(req.headers.authorization || "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  const parsed = verifyAdminToken(token);
  if (!parsed.valid) {
    return next(unauthorized("Kjo veprim kerkon login admin."));
  }
  req.admin = parsed.payload;
  return next();
}
