import { z } from "zod";
import { sliderService } from "../services/sliderService.js";
import { created, ok } from "../utils/apiResponse.js";

const schema = z.object({
  image_path: z.string().min(1),
  caption: z.string().optional().default("")
});

export const sliderController = {
  async list(_req, res) {
    return ok(res, await sliderService.list());
  },
  async create(req, res) {
    const payload = schema.parse(req.body);
    return created(res, await sliderService.create(payload));
  },
  async remove(req, res) {
    await sliderService.remove(Number(req.params.id));
    return ok(res, true, "Deleted");
  }
};
