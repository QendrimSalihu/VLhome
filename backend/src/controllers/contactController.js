import { z } from "zod";
import { contactService } from "../services/contactService.js";
import { created, ok } from "../utils/apiResponse.js";

const createSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  message: z.string().min(1)
});
const idSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const contactController = {
  async list(req, res) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const q = String(req.query.q || "").trim();
    return ok(res, await contactService.list({ page, limit, q }));
  },
  async create(req, res) {
    const payload = createSchema.parse(req.body);
    return created(res, await contactService.create(payload));
  },
  async remove(req, res) {
    const { id } = idSchema.parse(req.params);
    return ok(res, await contactService.remove(id), "Mesazhi u fshi.");
  },
  async removeByQuery(req, res) {
    const { id } = idSchema.parse(req.query);
    return ok(res, await contactService.remove(id), "Mesazhi u fshi.");
  },
  async removeByBody(req, res) {
    const { id } = idSchema.parse(req.body || {});
    return ok(res, await contactService.remove(id), "Mesazhi u fshi.");
  }
};
