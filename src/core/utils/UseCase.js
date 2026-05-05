/**
 * @file UseCase.js
 * @description Abstract base class for all application use cases.
 * Every concrete use case must override execute().
 */
export class UseCase {
  /**
   * Execute the use case.
   * @param {*} [input] - Input parameters (feature-specific shape).
   * @returns {Promise<{ success: boolean, data?: *, error?: import('../error/Failure').Failure }>}
   */
  async execute(_input) {
    throw new Error('UseCase.execute() is not implemented. Override in subclass.');
  }
}
