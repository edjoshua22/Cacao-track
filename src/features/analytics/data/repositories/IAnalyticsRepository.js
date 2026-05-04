/**
 * @file IAnalyticsRepository.js
 * @description Interface for the Analytics repository.
 */
export class IAnalyticsRepository {
  /**
   * Subscribe to sensor data and yield domain entities.
   * @param {function(import('../../domain/entities/SensorEntry').SensorEntry[]): void} onData
   * @param {function(Error): void} onError
   * @returns {function} unsubscribe
   */
  // eslint-disable-next-line no-unused-vars
  subscribeToAnalyticsData(onData, onError) {
    throw new Error('Not implemented');
  }
}
