/**
 * @file AnalyticsRepositoryImpl.js
 * @description Concrete repository implementation. Delegates to the Remote Data Source.
 */
import { IAnalyticsRepository } from './IAnalyticsRepository';

export class AnalyticsRepositoryImpl extends IAnalyticsRepository {
  /**
   * @param {object} params Injected dependencies
   * @param {import('../datasources/IAnalyticsDataSource').IAnalyticsDataSource} params.analyticsRemoteDataSource
   */
  constructor({ analyticsRemoteDataSource }) {
    super();
    this._remoteDataSource = analyticsRemoteDataSource;
  }

  subscribeToAnalyticsData(onData, onError) {
    return this._remoteDataSource.subscribeToSensorData(onData, onError);
  }
}
