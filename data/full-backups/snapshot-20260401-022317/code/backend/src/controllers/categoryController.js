import { z } from "zod";
import { categoryService } from "../services/categoryService.js";
import { created, ok } from "../utils/apiResponse.js";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  image_path: z.string().optional().default("")
});

export const categoryController = {
  async list(_req, res) {
    return ok(res, await categoryService.list());
  },
  async create(req, res) {
    const payload = schema.parse(req.body);
    return created(res, await categoryService.create(payload));
  },
  async update(req, res) {
    const payload = schema.parse(req.body);
    return ok(res, await categoryService.update(Number(req.params.id), payload));
  },
  async remove(req, res) {
    await categoryService.remove(Number(req.params.id));
    return ok(res, true, "Deleted");
  }
};
