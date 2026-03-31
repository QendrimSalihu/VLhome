import { customerRepository } from "../repositories/customerRepository.js";

export const customerService = {
  list(params = {}) {
    return customerRepository.listPaginated(params);
  },
  remove(id) {
    return customerRepository.remove(id);
  }
};
