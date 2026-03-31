import { sliderRepository } from "../repositories/sliderRepository.js";
import { createDatabaseBackup } from "../utils/autoBackup.js";

export const sliderService = {
  list() {
    return sliderRepository.getAll();
  },
  create(data) {
    return sliderRepository.create(data).then((result) => {
      createDatabaseBackup("slide_shtuar");
      return result;
    });
  },
  remove(id) {
    return sliderRepository.remove(id).then((result) => {
      createDatabaseBackup("slide_fshire");
      return result;
    });
  }
};
