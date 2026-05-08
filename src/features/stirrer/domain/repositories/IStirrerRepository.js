/**
 * @file IStirrerRepository.js
 * @description Abstract interface for the stirrer repository.
 * The domain layer depends only on this interface, never on concrete implementations.
 */
export class IStirrerRepository {
  /** @returns {Promise<import('../../../core/utils/Result').Result>} */
  async startMotor()  { throw new Error('IStirrerRepository.startMotor() not implemented'); }

  /** @returns {Promise<import('../../../core/utils/Result').Result>} */
  async stopMotor()   { throw new Error('IStirrerRepository.stopMotor() not implemented'); }

  /** @returns {Promise<string|null>} Saved ESP32 IP, or null if not set. */
  async getEspIp()    { throw new Error('IStirrerRepository.getEspIp() not implemented'); }

  /**
   * @param {string} ip
   * @returns {Promise<void>}
   */
  async saveEspIp(ip) { throw new Error('IStirrerRepository.saveEspIp() not implemented'); }
}
