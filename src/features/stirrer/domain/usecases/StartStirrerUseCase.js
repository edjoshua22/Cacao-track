/**
 * @file StartStirrerUseCase.js
 * @description Use case: send start command to the stirrer motor via the repository.
 */
import { Failure } from '../../../../core/error/Failure';

export class StartStirrerUseCase {
  /** @param {{ stirrerRepository: import('../repositories/IStirrerRepository').IStirrerRepository }} deps */
  constructor({ stirrerRepository }) {
    this._repo = stirrerRepository;
  }

  /**
   * Execute the start command.
   * @returns {Promise<{ success: boolean, error?: Failure }>}
   */
  async execute() {
    try {
      return await this._repo.startMotor();
    } catch (error) {
      return { success: false, error: new Failure(error.message, error) };
    }
  }
}
