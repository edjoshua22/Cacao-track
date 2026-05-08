/**
 * @file StirrerViewModel.js
 * @description Maps the stirrer domain state to a UI-friendly view model shape.
 * The presentation layer only consumes this shape — never raw domain entities.
 */

/**
 * @typedef {object} StirrerViewModel
 * @property {boolean}     isRunning    - True if motor is currently running.
 * @property {boolean}     isSending    - True if an HTTP request is in flight.
 * @property {string|null} errorMessage - Human-readable error or null.
 * @property {string}      espIp        - Current ESP32 IP address.
 * @property {string}      statusLabel  - Display text: 'RUNNING' or 'STANDBY'.
 * @property {string}      statusColor  - Hex color matching the status.
 */

export const RUNNING_COLOR = '#22C55E';
export const STANDBY_COLOR = '#8B7355'; // matches colors.subtext warm tone

/**
 * Build a StirrerViewModel from raw state.
 * @param {{ isRunning: boolean, isSending: boolean, error: string|null, espIp: string }} state
 * @returns {StirrerViewModel}
 */
export const mapToStirrerViewModel = ({ isRunning, isSending, error, espIp }) => ({
  isRunning,
  isSending,
  errorMessage: error,
  espIp,
  statusLabel: isRunning ? 'RUNNING' : 'STANDBY',
  statusColor:  isRunning ? RUNNING_COLOR : STANDBY_COLOR,
});
