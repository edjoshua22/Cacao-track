/**
 * @file IAnalyticsDataSource.js
 * @description Interface (abstract contract) for the Analytics remote data source.
 * All implementations must satisfy this contract.
 */
export class IAnalyticsDataSource {
  /**
   * Subscribe to live sensorData stream.
   * @param {function(SensorEntry[]): void} onData
   * @param {function(Error): void}         onError
   * @returns {function} unsubscribe function
   */
  // eslint-disable-next-line no-unused-vars
  subscribeToSensorData(onData, onError) {
    throw new Error('IAnalyticsDataSource.subscribeToSensorData() not implemented');
  }
}
