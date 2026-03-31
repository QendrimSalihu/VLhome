import { customerService } from "../services/customerService.js";
import { ok } from "../utils/apiResponse.js";

export const customerController = {
  async list(_req, res) {
    return ok(res, await customerService.list());
  },
  async remove(req, res) {
    return ok(res, await customerService.remove(Number(req.params.id)));
  }
};
