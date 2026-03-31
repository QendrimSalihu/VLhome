import { productRepository } from "../repositories/productRepository.js";
import { createDatabaseBackup } from "../utils/autoBackup.js";

export const productService = {
  list(params = {}) {
    const hasPagination = params.page !== undefined || params.limit !== undefined || params.q !== undefined || params.category !== undefined || params.sort !== undefined;
    if (hasPagination) {
      return productRepository.listPaginated(params);
    }
    return productRepository.getAll();
  },
  get(id) {
    return productRepository.getById(id);
  },
  create(data) {
    return productRepository.create(data).then((result) => {
      createDatabaseBackup("produkt_shtuar");
      return result;
    });
  },
  update(id, data) {
    return productRepository.update(id, data).then((result) => {
      createDatabaseBackup("produkt_perditesuar");
      return result;
    });
  },
  remove(id) {
    return productRepository.remove(id).then((result) => {
      createDatabaseBackup("produkt_fshire");
      return result;
    });
  },
  like(id) {
    return productRepository.like(id).then((result) => {
      createDatabaseBackup("pelqim_produkti");
      return result;
    });
  },
  unlike(id) {
    return productRepository.unlike(id).then((result) => {
      createDatabaseBackup("heqje_pelqimi");
      return result;
    });
  }
};
