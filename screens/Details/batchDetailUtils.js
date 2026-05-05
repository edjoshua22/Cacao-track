/**
 * batchDetailUtils.js
 * Pure helper functions for BatchDetail — no React imports.
 */

/**
 * Compute per-stage chart data arrays from stagesData.
 * @param {object} stagesData
 * @param {string} dayKey
 * @returns {{ labels: string[], tempData: number[], humidData: number[], moistureData: number[] }}
 */
export const getStageChartData = (stagesData, dayKey) => {
  const stage = stagesData?.[dayKey];
  if (!stage?.sensorData?.length) {
    return { labels: [], tempData: [], humidData: [], moistureData: [] };
  }
  const sorted = [...stage.sensorData].sort((a, b) => a.timestamp - b.timestamp);
  return {
    labels:       sorted.map((_, i) => `${i + 1}`),
    tempData:     sorted.map(d => d.temperature),
    humidData:    sorted.map(d => d.humidity),
    moistureData: sorted.map(d => d.moisture),
  };
};

/**
 * Compute average sensor stats for one fermentation stage.
 * @param {object} stagesData
 * @param {string} dayKey
 * @returns {{ avgTemp: number, avgHumidity: number, avgMoisture: number, count: number }}
 */
export const getStageStats = (stagesData, dayKey) => {
  const stage = stagesData?.[dayKey];
  if (!stage?.sensorData?.length) return { avgTemp: 0, avgHumidity: 0, avgMoisture: 0, count: 0 };
  const data = stage.sensorData;
  return {
    avgTemp:     data.reduce((s, d) => s + d.temperature, 0) / data.length,
    avgHumidity: data.reduce((s, d) => s + d.humidity,    0) / data.length,
    avgMoisture: data.reduce((s, d) => s + d.moisture,    0) / data.length,
    count:       data.length,
  };
};

/**
 * Compute average stats for the allReadings array.
 * @param {object[]} allReadings
 * @returns {{ avgTemp: string, avgHumidity: string, avgMoisture: string, total: number }}
 */
export const getAllReadingsStats = (allReadings = []) => {
  if (!allReadings.length) return { avgTemp: '0.0', avgHumidity: '0.0', avgMoisture: '0.0', total: 0 };
  const n = allReadings.length;
  return {
    avgTemp:     (allReadings.reduce((s, d) => s + d.temperature, 0) / n).toFixed(1),
    avgHumidity: (allReadings.reduce((s, d) => s + d.humidity,    0) / n).toFixed(1),
    avgMoisture: (allReadings.reduce((s, d) => s + d.moisture,    0) / n).toFixed(1),
    total: n,
  };
};
