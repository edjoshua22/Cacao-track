/**
 * @file Failure.js
 * @description Base Failure class representing a domain-level error.
 * All use-case error results wrap a Failure instance.
 */
export class Failure {
  /**
   * @param {string} message - Human-readable error description.
   * @param {Error|null} [cause=null] - Original error, if any.
   */
  constructor(message, cause = null) {
    this.message = message;
    this.cause   = cause;
  }

  /** @returns {string} String representation for logging. */
  toString() {
    return `Failure: ${this.message}${this.cause ? ` (caused by: ${this.cause.message})` : ''}`;
  }
}
