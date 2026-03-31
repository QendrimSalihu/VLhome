import { z } from "zod";
import { env } from "../config/env.js";
import { createAdminToken } from "../utils/adminToken.js";
import { ok } from "../utils/apiResponse.js";
import { unauthorized } from "../utils/httpError.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const adminController = {
  async login(req, res) {
    const payload = loginSchema.parse(req.body || {});
    if (payload.email !== env.adminEmail || payload.password !== env.adminPassword) {
      throw unauthorized("Email ose password gabim.");
    }
    const token = createAdminToken({ email: payload.email });
    return ok(res, {
      token,
      expires_in_hours: env.adminTokenTtlHours
    }, "Admin login successful");
  }
};
