import { getDb } from "../database/connection.js";

const PERIOD_SQL = {
  "7d": "datetime('now', '-7 days')",
  "30d": "datetime('now', '-30 days')",
  all: null
};

export const siteAnalyticsRepository = {
  async record({ eventType, pagePath, visitorId }) {
    const db = await getDb();
    await db.run(
      "INSERT INTO site_analytics_events (event_type, page_path, visitor_id) VALUES (?, ?, ?)",
      [eventType, pagePath, visitorId]
    );
  },

  async summary(period) {
    const db = await getDb();
    const cutoff = PERIOD_SQL[period];
    const where = cutoff ? `WHERE created_at >= ${cutoff}` : "";
    const totals = await db.get(`
      SELECT
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) AS page_views,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' AND visitor_id <> '' THEN visitor_id END) AS unique_visitors,
        COUNT(CASE WHEN event_type = 'page_view' AND page_path = '/contact.html' THEN 1 END) AS contact_views,
        COUNT(CASE WHEN event_type = 'instagram_click' AND page_path = '/contact.html' THEN 1 END) AS instagram_clicks
      FROM site_analytics_events ${where}
    `);
    const pages = await db.all(`
      SELECT page_path, COUNT(*) AS views
      FROM site_analytics_events ${where ? `${where} AND` : "WHERE"} event_type = 'page_view'
      GROUP BY page_path
      ORDER BY views DESC, page_path ASC
      LIMIT 10
    `);
    return { period, totals, pages };
  }
};
