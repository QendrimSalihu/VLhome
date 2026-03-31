import { ok } from "../utils/apiResponse.js";

export function healthController(_req, res) {
  return ok(res, { status: "up" });
}
