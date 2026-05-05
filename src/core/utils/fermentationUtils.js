/**
 * @file fermentationUtils.js
 * @description Shared fermentation calculation helpers.
 * Used by both the fermentation feature and exportUtils.
 */

/**
 * Safely parse a timestamp string with multiple format support.
 * @param {string} timestampStr - Raw string (YYYY-MM-DD_HH-MM-SS, YYYYMMDD_HHMMSS, or ISO).
 * @returns {Date|null} Parsed Date or null on failure.
 */
export const safeParseTimestamp = (timestampStr) => {
  if (!timestampStr || typeof timestampStr !== 'string') return null;
  try {
    if (timestampStr.includes('_')) {
      const [datePart, timePart] = timestampStr.split('_');
      if (timestampStr.includes('-')) {
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
        if ([year, month, day, hour, minute, second].some(isNaN)) return null;
        return new Date(year, month - 1, day, hour, minute, second);
      } else {
        if (datePart.length !== 8 || timePart.length !== 6) return null;
        const year   = parseInt(datePart.substring(0, 4));
        const month  = parseInt(datePart.substring(4, 6));
        const day    = parseInt(datePart.substring(6, 8));
        const hour   = parseInt(timePart.substring(0, 2));
        const minute = parseInt(timePart.substring(2, 4));
        const second = parseInt(timePart.substring(4, 6));
        if ([year, month, day, hour, minute, second].some(isNaN)) return null;
        return new Date(year, month - 1, day, hour, minute, second);
      }
    } else {
      const date = new Date(timestampStr);
      return isNaN(date.getTime()) ? null : date;
    }
  } catch { return null; }
};

/**
 * Calculate fermentation day and stage name from a timestamp.
 * @param {string} timestamp - Raw timestamp string.
 * @param {number|null} [batchStartTime=null] - Optional batch start epoch ms.
 * @returns {{ dayKey: string, stageName: string, dayNumber: number }}
 */
export const calculateFermentationDay = (timestamp, batchStartTime = null) => {
  const imageTime = safeParseTimestamp(timestamp);
  if (!imageTime) return { dayKey: 'day0', stageName: 'Unknown', dayNumber: 0 };

  const referenceTime = batchStartTime || imageTime;
  const elapsedDays   = Math.floor((Date.now() - referenceTime) / (24 * 60 * 60 * 1000));

  if (elapsedDays >= 6) return { dayKey: 'day6', stageName: 'Drying Ready',          dayNumber: 6 };
  if (elapsedDays >= 5) return { dayKey: 'day5', stageName: 'Maturation',             dayNumber: 5 };
  if (elapsedDays >= 3) return { dayKey: 'day3', stageName: 'Aerobic',                dayNumber: 3 };
  if (elapsedDays >= 2) return { dayKey: 'day2', stageName: 'Anaerobic / Alcoholic',  dayNumber: 2 };
  if (elapsedDays >= 1) return { dayKey: 'day1', stageName: 'Anaerobic',              dayNumber: 1 };
  return { dayKey: 'day0', stageName: 'Fresh', dayNumber: 0 };
};

/**
 * Safe sort comparator by timestamp field.
 * @param {{ timestamp?: string }} a
 * @param {{ timestamp?: string }} b
 * @param {boolean} [ascending=true]
 * @returns {number}
 */
export const safeSortByTimestamp = (a, b, ascending = true) => {
  const timeA = safeParseTimestamp(a.timestamp || a);
  const timeB = safeParseTimestamp(b.timestamp || b);
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return ascending ? timeA.getTime() - timeB.getTime() : timeB.getTime() - timeA.getTime();
};

/**
 * Calculate cacao batch quality based on sensor averages.
 * @param {number} avgTemp - Average temperature (°C).
 * @param {number} avgHumidity - Average humidity (%).
 * @param {number} dataPoints - Number of data points recorded.
 * @returns {'Good'|'Fair'|'Needs Attention'}
 */
export const calculateBatchQuality = (avgTemp, avgHumidity, dataPoints) => {
  if (!dataPoints || dataPoints === 0) return 'Needs Attention';
  const tempInRange     = avgTemp >= 45 && avgTemp <= 50;
  const humidityInRange = avgHumidity >= 60 && avgHumidity <= 80;
  if (tempInRange && humidityInRange) return 'Good';
  if (tempInRange || humidityInRange) return 'Fair';
  return 'Needs Attention';
};

/**
 * Calculate batch status string.
 * @param {number|null} completedAt - Epoch ms of completion, or null.
 * @param {number}      createdAt   - Epoch ms of creation.
 * @param {number}      dataPoints  - Number of sensor readings.
 * @returns {'Finished'|'Ongoing'|'Just Started'}
 */
export const calculateBatchStatus = (completedAt, createdAt, dataPoints) => {
  if (completedAt)    return 'Finished';
  if (dataPoints > 0) return 'Ongoing';
  return 'Just Started';
};
