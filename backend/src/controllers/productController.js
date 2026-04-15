import { z } from "zod";
import { productService } from "../services/productService.js";
import { created, ok } from "../utils/apiResponse.js";

const schema = z.object({
  category_id: z.coerce.number().int().positive(),
  title: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  discount_price: z.coerce.number().nonnegative().optional().default(0),
  description: z.string().optional().default(""),
  image_path: z.string().optional().default(""),
  gallery_paths: z.array(z.string()).optional().default([]),
  is_new_arrival: z.coerce.number().int().min(0).max(1).optional().default(0),
  is_best_seller: z.coerce.number().int().min(0).max(1).optional().default(0),
  sold_count: z.coerce.number().int().min(0).optional().default(0),
  stock_qty: z.coerce.number().int().min(0).optional().default(999),
  set_persons: z
    .preprocess((value) => {
      if (value === "" || value === undefined || value === null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }, z.union([z.literal(6), z.literal(12), z.literal(18), z.null()]))
    .optional()
    .default(null),
  rating_value: z
    .preprocess((value) => {
      if (value === "" || value === undefined || value === null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }, z.union([z.number().min(0).max(5), z.null()]))
    .optional()
    .default(null),
  is_active: z.coerce.number().int().min(0).max(1).optional().default(1)
});

export const productController = {
  async list(req, res) {
    const query = {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      category: req.query.category,
      sort: req.query.sort,
      is_new_arrival: req.query.is_new_arrival,
      is_best_seller: req.query.is_best_seller,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      min_sold: req.query.min_sold,
      has_discount: req.query.has_discount,
      include_inactive: req.query.include_inactive
    };
    return ok(res, await productService.list(query));
  },
  async get(req, res) {
    return ok(res, await productService.get(Number(req.params.id)));
  },
  async create(req, res) {
    const payload = schema.parse(req.body);
    const rawRating = req.body?.rating_value;
    if (rawRating !== undefined && rawRating !== null && rawRating !== "") {
      const parsedRating = Number(rawRating);
      if (Number.isFinite(parsedRating)) {
        payload.rating_value = Math.max(0, Math.min(5, parsedRating));
      }
    }
    return created(res, await productService.create(payload));
  },
  async update(req, res) {
    const payload = schema.parse(req.body);
    const rawRating = req.body?.rating_value;
    if (rawRating !== undefined && rawRating !== null && rawRating !== "") {
      const parsedRating = Number(rawRating);
      if (Number.isFinite(parsedRating)) {
        payload.rating_value = Math.max(0, Math.min(5, parsedRating));
      }
    }
    return ok(res, await productService.update(Number(req.params.id), payload));
  },
  async remove(req, res) {
    const result = await productService.remove(Number(req.params.id));
    return ok(res, result, "Deleted");
  },
  async removeAll(_req, res) {
    return ok(res, await productService.removeAll(), "Deleted all products");
  },
  async like(req, res) {
    return ok(res, await productService.like(Number(req.params.id)));
  },
  async unlike(req, res) {
    return ok(res, await productService.unlike(Number(req.params.id)));
  }
};
