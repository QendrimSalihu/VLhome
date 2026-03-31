import { whatsappMessageRepository } from "../repositories/whatsappMessageRepository.js";

export const whatsappMessageService = {
  create(payload) {
    return whatsappMessageRepository.create(payload);
  },
  list(params = {}) {
    return whatsappMessageRepository.listPaginated(params);
  },
  async remove(id) {
    await whatsappMessageRepository.remove(id);
    return { id };
  }
};
