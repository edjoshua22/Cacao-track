/**
 * @file Result.js
 * @description Lightweight Result type helpers for Railway-Oriented Programming.
 * Use cases return ok() on success and fail() on error — callers check result.success.
 */

/**
 * Wrap a successful value.
 * @template T
 * @param {T} data - The successful result payload.
 * @returns {{ success: true, data: T }}
 */
export const ok = (data) => ({ success: true, data });

/**
 * Wrap a failure value.
 * @param {import('../error/Failure').Failure} error - The failure reason.
 * @returns {{ success: false, error: import('../error/Failure').Failure }}
 */
export const fail = (error) => ({ success: false, error });
