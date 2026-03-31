import { orderRepository } from "../repositories/orderRepository.js";
import { createDatabaseBackup } from "../utils/autoBackup.js";

export const orderService = {
  list(params) {
    return orderRepository.listPaginated(params);
  },
  get(id) {
    return orderRepository.getById(id);
  },
  create(payload) {
    return orderRepository.createOrder(payload).then((result) => {
      createDatabaseBackup("porosi_shtuar");
      return result;
    });
  },
  updateStatus(id, status) {
    return orderRepository.updateStatus(id, status).then((result) => {
      createDatabaseBackup("status_porosi_perditesuar");
      return result;
    });
  },
  remove(id) {
    return orderRepository.deleteOrder(id).then((result) => {
      createDatabaseBackup("porosi_fshire");
      return result;
    });
  },
  removeAll() {
    return orderRepository.deleteAllOrders().then((result) => {
      createDatabaseBackup("te_gjitha_porosite_fshire");
      return result;
    });
  }
};
