import { z } from "zod";
import { contactService } from "../services/contactService.js";
import { created, ok } from "../utils/apiResponse.js";

const createSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  message: z.string().min(1)
});

export const contactController = {
  async list(_req, res) {
    return ok(res, await contactService.list());
  },
  async create(req, res) {
    const payload = createSchema.parse(req.body);
    return created(res, await contactService.create(payload));
  }
};

