/**
 * @file AppError.js
 * @description Custom application error class that extends native Error.
 * Use this when you need to throw a structured error with a code.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable description.
   * @param {string} [code='UNKNOWN'] - Machine-readable error code.
   * @param {Error|null} [cause=null] - Original cause, if any.
   */
  constructor(message, code = 'UNKNOWN', cause = null) {
    super(message);
    this.name  = 'AppError';
    this.code  = code;
    this.cause = cause;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
