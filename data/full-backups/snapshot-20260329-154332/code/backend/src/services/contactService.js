import { contactRepository } from "../repositories/contactRepository.js";

export const contactService = {
  create(payload) {
    return contactRepository.create(payload);
  },
  list() {
    return contactRepository.list();
  },
  async remove(id) {
    await contactRepository.remove(id);
    return { id };
  }
};
