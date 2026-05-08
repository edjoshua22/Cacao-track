/**
 * @file GetEspIpUseCase.js
 * @description Use case: load the saved ESP32 IP address from persistent storage.
 */
export class GetEspIpUseCase {
  /** @param {{ stirrerRepository: import('../repositories/IStirrerRepository').IStirrerRepository }} deps */
  constructor({ stirrerRepository }) {
    this._repo = stirrerRepository;
  }

  /**
   * @returns {Promise<string|null>}
   */
  async execute() {
    return this._repo.getEspIp();
  }
}
