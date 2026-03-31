import { customerService } from "../services/customerService.js";
import { ok } from "../utils/apiResponse.js";

export const customerController = {
  async list(req, res) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const q = String(req.query.q || "").trim();
    return ok(res, await customerService.list({ page, limit, q }));
  },
  async remove(req, res) {
    return ok(res, await customerService.remove(Number(req.params.id)));
  }
};
