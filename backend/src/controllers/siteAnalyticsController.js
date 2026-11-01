import { z } from "zod";
import { siteAnalyticsRepository } from "../repositories/siteAnalyticsRepository.js";
import { ok } from "../utils/apiResponse.js";

const eventSchema = z.object({
  event_type: z.enum(["page_view", "instagram_click"]),
  page_path: z.string().max(64).regex(/^\/(?:[a-z0-9-]+\.html)?$/),
  visitor_id: z.union([z.string().regex(/^[a-f0-9]{32}$/), z.literal("")]).optional().default("")
});
const summarySchema = z.object({ period: z.enum(["7d", "30d", "all"]).default("30d") });

export const siteAnalyticsController = {
  async record(req, res) {
    const event = eventSchema.parse(req.body);
    await siteAnalyticsRepository.record({
      eventType: event.event_type,
      pagePath: event.page_path === "/" ? "/index.html" : event.page_path,
      visitorId: event.visitor_id
    });
    return res.status(204).end();
  },
  async summary(req, res) {
    const { period } = summarySchema.parse(req.query);
    return ok(res, await siteAnalyticsRepository.summary(period));
  }
};
