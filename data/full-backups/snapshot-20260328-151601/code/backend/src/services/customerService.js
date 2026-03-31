import { customerRepository } from "../repositories/customerRepository.js";

export const customerService = {
  list() {
    return customerRepository.getAll();
  },
  remove(id) {
    return customerRepository.remove(id);
  }
};
