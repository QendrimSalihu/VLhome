import { categoryRepository } from "../repositories/categoryRepository.js";
import { createDatabaseBackup } from "../utils/autoBackup.js";

export const categoryService = {
  async list() {
    await categoryRepository.repairMissingImagesFromProducts();
    return categoryRepository.getAll();
  },
  create(data) {
    return categoryRepository.create(data).then((result) => {
      createDatabaseBackup("kategori_shtuar");
      return result;
    });
  },
  update(id, data) {
    return categoryRepository.update(id, data).then((result) => {
      createDatabaseBackup("kategori_perditesuar");
      return result;
    });
  },
  remove(id) {
    return categoryRepository.remove(id).then((result) => {
      createDatabaseBackup("kategori_fshire");
      return result;
    });
  }
};
