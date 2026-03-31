import { ok } from "../utils/apiResponse.js";
import { deliveryZoneService } from "../services/deliveryZoneService.js";

export const deliveryZoneController = {
  async list(_req, res) {
    return ok(res, await deliveryZoneService.listActive());
  }
};
