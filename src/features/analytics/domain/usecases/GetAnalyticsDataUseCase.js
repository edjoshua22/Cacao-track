/**
 * @file GetAnalyticsDataUseCase.js
 * @description Use Case to subscribe to analytics data and process it via the ChartSeriesFactory.
 */
import { ChartSeriesFactory } from '../../factories/ChartSeriesFactory';

export class GetAnalyticsDataUseCase {
  /**
   * @param {object} params Injected dependencies
   * @param {import('../../data/repositories/IAnalyticsRepository').IAnalyticsRepository} params.analyticsRepository
   */
  constructor({ analyticsRepository }) {
    this._repository = analyticsRepository;
  }

  /**
   * Subscribes to raw entries and yields fully formatted view models.
   * @param {function(object): void} onResult Callback yielding { overviewSeries, dayGroups, stats, latest, totalReadings }
   * @param {function(Error): void} onError
   * @returns {function} unsubscribe function
   */
  execute(onResult, onError) {
    return this._repository.subscribeToAnalyticsData((entries) => {
      try {
        if (!entries || entries.length === 0) {
          onResult({
            overviewSeries: null,
            dayGroups: [],
            stats: null,
            latest: null,
            totalReadings: 0
          });
          return;
        }

        const overviewSeries = ChartSeriesFactory.overview(entries);
        const stats = ChartSeriesFactory.stats(entries);
        
        // Group by date, convert entries into full day views
        const dayMap = ChartSeriesFactory.groupByDate(entries);
        const dayGroups = Array.from(dayMap.entries()).map(([dateStr, dayEntries]) => {
           return {
             dateStr,
             entries: dayEntries,
             series: ChartSeriesFactory.forDay(dayEntries),
             stats: ChartSeriesFactory.stats(dayEntries),
           };
        });

        const latest = entries[entries.length - 1];

        onResult({
          overviewSeries,
          dayGroups,
          stats,
          latest,
          totalReadings: entries.length
        });
      } catch (err) {
        console.error('[GetAnalyticsDataUseCase] processing error:', err);
        onError?.(err);
      }
    }, onError);
  }
}
