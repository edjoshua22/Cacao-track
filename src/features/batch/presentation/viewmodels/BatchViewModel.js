/**
 * @file BatchViewModel.js
 * @description Maps a Batch domain entity to the shape consumed by the presentation layer.
 */

/**
 * Map a Batch entity to a UI-friendly view model object.
 * @param {import('../../domain/entities/Batch').Batch} batch
 * @returns {{ id: string, title: string, subtitle: string, statusLabel: string, date: string, createdAt: number|null, raw: object }}
 */
export const mapBatchToViewModel = (batch) => ({
  id:          batch.id,
  title:       batch.name,
  subtitle:    `${batch.dataPoints} data points`,
  statusLabel: (batch.status || 'Unknown').toUpperCase(),
  quality:     batch.quality || 'Needs Attention',
  date:        batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'Unknown date',
  createdAt:   batch.createdAt,
  avgTemp:     batch.avgTemp     ?? 0,
  avgHumidity: batch.avgHumidity ?? 0,
  avgMoisture: batch.avgMoisture ?? 0,
  dataPoints:  batch.dataPoints  ?? 0,
  notes:       batch.notes,
  // Preserve day buckets for analytics dashboard
  day0: batch.day0, day1: batch.day1, day2: batch.day2,
  day3: batch.day3, day4: batch.day4, day5: batch.day5, day6: batch.day6,
  sensorData: batch.sensorData,
});
