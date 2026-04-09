import { z } from "zod";
import { env } from "../config/env.js";
import { createAdminToken } from "../utils/adminToken.js";
import { ok } from "../utils/apiResponse.js";
import { unauthorized } from "../utils/httpError.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function buildAdminCookieOptions(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const isHttps = req.secure || forwardedProto === "https";
  const secure = env.isProduction ? isHttps : false;
  return {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/"
  };
}

export const adminController = {
  async login(req, res) {
    const payload = loginSchema.parse(req.body || {});
    if (payload.email !== env.adminEmail || payload.password !== env.adminPassword) {
      throw unauthorized("Email ose password gabim.");
    }
    const token = createAdminToken({ email: payload.email });
    const maxAgeMs = Math.max(1, env.adminTokenTtlHours) * 60 * 60 * 1000;
    const cookieOptions = buildAdminCookieOptions(req);
    res.cookie(env.adminCookieName, token, {
      ...cookieOptions,
      maxAge: maxAgeMs
    });
    return ok(res, {
      expires_in_hours: env.adminTokenTtlHours
    }, "Admin login successful");
  },

  async session(req, res) {
    return ok(res, {
      active: true,
      email: req.admin?.email || env.adminEmail
    }, "Admin session active");
  },

  async logout(req, res) {
    const cookieOptions = buildAdminCookieOptions(req);
    res.clearCookie(env.adminCookieName, {
      ...cookieOptions
    });
    return ok(res, { logged_out: true }, "Admin logout successful");
  }
};
