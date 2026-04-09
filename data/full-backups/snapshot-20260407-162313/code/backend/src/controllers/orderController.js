import { z } from "zod";
import { orderService } from "../services/orderService.js";
import { created, ok } from "../utils/apiResponse.js";

const createSchema = z.object({
  customer: z.object({
    full_name: z.string().min(1),
    phone: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(1),
    social_name: z.string().optional().default(""),
    note: z.string().optional().default("")
  }),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive()
      })
    )
    .min(1),
  delivery_zone_id: z.coerce.number().int().positive()
});

const statusSchema = z.object({
  status: z.enum([
    "Porosia e Pranuar",
    "Ne Transport",
    "E Dorezuar",
    "E Anuluar",
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled"
  ])
});

const trackSchema = z.object({
  tracking_code: z.string().min(1, "Shkruaj kodin e porosise.")
});

export const orderController = {
  async trackPublic(req, res) {
    const payload = trackSchema.parse({
      tracking_code: String(req.query.tracking_code || "").trim()
    });
    return ok(res, await orderService.trackPublic(payload));
  },
  async list(req, res) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const status = String(req.query.status || "").trim();
    const q = String(req.query.q || "").trim();
    return ok(
      res,
      await orderService.list({
        page,
        limit,
        status,
        q
      })
    );
  },
  async get(req, res) {
    return ok(res, await orderService.get(Number(req.params.id)));
  },
  async create(req, res) {
    const payload = createSchema.parse(req.body);
    return created(res, await orderService.create(payload));
  },
  async updateStatus(req, res) {
    const payload = statusSchema.parse(req.body);
    return ok(res, await orderService.updateStatus(Number(req.params.id), payload.status));
  },
  async remove(req, res) {
    return ok(res, await orderService.remove(Number(req.params.id)));
  },
  async removeAll(_req, res) {
    return ok(res, await orderService.removeAll(), "Deleted all orders");
  }
};
