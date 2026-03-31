import { deliveryZoneRepository } from "../repositories/deliveryZoneRepository.js";

export const deliveryZoneService = {
  listActive() {
    return deliveryZoneRepository.listActive();
  },
  getById(id) {
    return deliveryZoneRepository.getById(id);
  }
};
