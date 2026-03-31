import { z } from "zod";
import { settingService } from "../services/settingService.js";
import { ok } from "../utils/apiResponse.js";

const updateSchema = z.object({
  store_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  instagram_url: z.string().optional(),
  free_shipping_threshold: z.coerce.number().nonnegative().optional()
});

export const settingController = {
  async get(_req, res) {
    return ok(res, await settingService.getAll());
  },
  async update(req, res) {
    const payload = updateSchema.parse(req.body);
    return ok(res, await settingService.update(payload));
  }
};

