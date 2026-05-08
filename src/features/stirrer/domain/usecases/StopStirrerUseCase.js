/**
 * @file StopStirrerUseCase.js
 * @description Use case: send stop command to the stirrer motor via the repository.
 */
import { Failure } from '../../../../core/error/Failure';

export class StopStirrerUseCase {
  /** @param {{ stirrerRepository: import('../repositories/IStirrerRepository').IStirrerRepository }} deps */
  constructor({ stirrerRepository }) {
    this._repo = stirrerRepository;
  }

  /**
   * Execute the stop command.
   * @returns {Promise<{ success: boolean, error?: Failure }>}
   */
  async execute() {
    try {
      return await this._repo.stopMotor();
    } catch (error) {
      return { success: false, error: new Failure(error.message, error) };
    }
  }
}
