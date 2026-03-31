import { settingRepository } from "../repositories/settingRepository.js";

export const settingService = {
  getAll() {
    return settingRepository.getAll();
  },
  update(payload) {
    return settingRepository.upsertMany(payload);
  }
};

