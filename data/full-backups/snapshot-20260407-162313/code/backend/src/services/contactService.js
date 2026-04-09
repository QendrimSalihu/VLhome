import { contactRepository } from "../repositories/contactRepository.js";

export const contactService = {
  create(payload) {
    return contactRepository.create(payload);
  },
  list(params = {}) {
    return contactRepository.listPaginated(params);
  },
  async remove(id) {
    await contactRepository.remove(id);
    return { id };
  }
};
