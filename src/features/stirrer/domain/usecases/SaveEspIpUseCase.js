/**
 * @file SaveEspIpUseCase.js
 * @description Use case: persist the ESP32 IP address to storage.
 */
export class SaveEspIpUseCase {
  /** @param {{ stirrerRepository: import('../repositories/IStirrerRepository').IStirrerRepository }} deps */
  constructor({ stirrerRepository }) {
    this._repo = stirrerRepository;
  }

  /**
   * @param {string} ip
   * @returns {Promise<void>}
   */
  async execute(ip) {
    return this._repo.saveEspIp(ip);
  }
}
