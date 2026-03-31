import { whatsappMessageRepository } from "../repositories/whatsappMessageRepository.js";

export const whatsappMessageService = {
  create(payload) {
    return whatsappMessageRepository.create(payload);
  },
  list() {
    return whatsappMessageRepository.list();
  },
  async remove(id) {
    await whatsappMessageRepository.remove(id);
    return { id };
  }
};

