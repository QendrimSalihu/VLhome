import { z } from "zod";
import { created, ok } from "../utils/apiResponse.js";
import { whatsappMessageService } from "../services/whatsappMessageService.js";

const createSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional().default(""),
  message: z.string().min(1),
  source_page: z.string().optional().default("")
});

const idSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const whatsappMessageController = {
  async create(req, res) {
    const payload = createSchema.parse(req.body);
    return created(res, await whatsappMessageService.create(payload));
  },
  async list(req, res) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const q = String(req.query.q || "").trim();
    return ok(res, await whatsappMessageService.list({ page, limit, q }));
  },
  async remove(req, res) {
    const { id } = idSchema.parse(req.params);
    return ok(res, await whatsappMessageService.remove(id), "WhatsApp mesazhi u fshi.");
  }
};
