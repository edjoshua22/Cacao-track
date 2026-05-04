/**
 * batchUtils.js
 * Pure helper functions for batch creation logic.
 * Extracted from AddButton.js — no UI, no React imports.
 */
import { getDatabase, ref, push, set, get, query, orderByKey, startAt, limitToLast } from 'firebase/database';
import { app }                  from '../../firebaseConfig.secure';
import { initializeAuth, getUserId } from '../../utils/authUtils';
import { inferImage }           from '../../utils/inferImage';

// ── Timestamp parser ──────────────────────────────────────────────────────────

/**
 * Parse an Arduino history key (e.g. "2025-01-01_12-30-00") to a JS Date.
 * @param {string} key
 * @returns {Date|null}
 */
export const parseHistoryKey = (key) => {
  try {
    const [datePart, timePart] = key.split('_');
    const [year, month, day]   = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split('-').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  } catch {
    return null;
  }
};

// ── Stage bucket builder ──────────────────────────────────────────────────────

/** @returns {object} Empty stage-bucket structure (day0–day6). */
const buildEmptyStages = () => ({
  day0: { sensorData: [], images: [], stageName: 'Fresh' },
  day1: { sensorData: [], images: [], stageName: 'Anaerobic' },
  day2: { sensorData: [], images: [], stageName: 'Anaerobic / Alcoholic' },
  day3: { sensorData: [], images: [], stageName: 'Aerobic' },
  day4: { sensorData: [], images: [], stageName: 'Aerobic' },
  day5: { sensorData: [], images: [], stageName: 'Maturation' },
  day6: { sensorData: [], images: [], stageName: 'Drying Ready' },
});

// ── History processor ─────────────────────────────────────────────────────────

/**
 * Populate stagesData sensor buckets from /history snapshot.
 * @param {object} stagesData - Mutable stage bucket object.
 * @param {object} historyVal - Raw Firebase /history value.
 * @param {number} batchStartTime - Epoch ms when the batch was created.
 */
const processHistory = (stagesData, historyVal, batchStartTime) => {
  const allReadings = [];
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  Object.entries(historyVal).forEach(([key, entry]) => {
    const date = parseHistoryKey(key);
    if (!date) return;
    const entryTime   = date.getTime();
    const temperature = parseFloat(entry.average?.temperature ?? 0) || 0;
    const humidity    = parseFloat(entry.average?.humidity ?? entry.humidity ?? 0) || 0;
    const moisture    = parseFloat(entry.soil ?? 0) || 0;
    const reading     = { timestamp: entryTime, temperature, humidity, moisture, time: entry.time || key };

    if (entryTime >= batchStartTime) {
      stagesData.day0.sensorData.push(reading);
      allReadings.push(reading);
    } else if (entryTime >= batchStartTime - ONE_WEEK_MS) {
      const daysBeforeStart = Math.floor((batchStartTime - entryTime) / (24 * 60 * 60 * 1000));
      const dayKey = `day${Math.min(6, Math.max(1, daysBeforeStart))}`;
      if (stagesData[dayKey]) stagesData[dayKey].sensorData.push(reading);
    }
  });

  stagesData.allReadings = allReadings.sort((a, b) => a.timestamp - b.timestamp);
};

// ── Image classifier ──────────────────────────────────────────────────────────

/**
 * Fetch, classify, and bucket captures into stagesData.
 * @param {object} stagesData
 * @param {object} capturesVal - Raw Firebase captures value.
 * @param {number} batchStartTime
 */
const processCaptures = async (stagesData, capturesVal, batchStartTime) => {
  const captureEntries = Object.entries(capturesVal)
    .map(([timestamp, url]) => ({ timestamp, url, imgTimestamp: parseInt(timestamp) || 0 }))
    .filter(img => img.imgTimestamp >= batchStartTime)
    .sort((a, b) => b.imgTimestamp - a.imgTimestamp)
    .slice(0, 15);

  const classified = await Promise.all(
    captureEntries.map(async ({ timestamp, url, imgTimestamp }) => {
      try {
        const result = await inferImage(url);
        return { timestamp, url, stage: result.stage || 'Unknown', dayKey: result.day || 'day0', imgTimestamp };
      } catch {
        return { timestamp, url, stage: 'Unknown', dayKey: 'day0', imgTimestamp };
      }
    }),
  );

  const allImages = [];
  classified.forEach(({ timestamp, url, stage, dayKey }) => {
    const imageData = { timestamp, url, stage };
    if (stagesData[dayKey]) stagesData[dayKey].images.push(imageData);
    allImages.push(imageData);
  });
  stagesData.allImages = allImages.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
};

// ── Average calculator ────────────────────────────────────────────────────────

/**
 * Compute avg temp / humidity / moisture from stagesData.
 * @param {object} stagesData
 * @returns {{ avgTemp: number, avgHumidity: number, avgMoisture: number, dataPoints: number }}
 */
const calcAverages = (stagesData) => {
  let totalTemp = 0, totalHumidity = 0, totalMoisture = 0, totalDataPoints = 0;
  const source = stagesData.allReadings?.length > 0
    ? stagesData.allReadings
    : Object.values(stagesData).flatMap(s => (Array.isArray(s?.sensorData) ? s.sensorData : []));

  source.forEach(entry => {
    totalTemp      += entry.temperature;
    totalHumidity  += entry.humidity;
    totalMoisture  += entry.moisture;
    totalDataPoints++;
  });

  return {
    avgTemp:     totalDataPoints > 0 ? totalTemp      / totalDataPoints : 0,
    avgHumidity: totalDataPoints > 0 ? totalHumidity  / totalDataPoints : 0,
    avgMoisture: totalDataPoints > 0 ? totalMoisture  / totalDataPoints : 0,
    dataPoints:  totalDataPoints,
  };
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new batch in Firebase under the authenticated user's node.
 * @param {string} name    - Batch display name.
 * @param {string} [notes] - Optional notes.
 * @param {number} [customStartTime] - Optional epoch ms for historical batches.
 * @returns {Promise<object>} The persisted batch data object.
 */
export const createBatch = async (name, notes = '', customStartTime = null) => {
  await initializeAuth();
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db            = getDatabase(app);
  const batchStartTime = customStartTime || Date.now();
  const sevenDaysAgo  = new Date(batchStartTime - 7 * 24 * 60 * 60 * 1000);
  const startKey      = sevenDaysAgo.toISOString().split('T')[0] + '_00-00-00';

  const [historySnapshot, capturesSnapshot] = await Promise.all([
    get(query(ref(db, 'history'), orderByKey(), startAt(startKey))),
    get(query(ref(db, `captures/${userId}`), limitToLast(50))),
  ]);

  const stagesData = buildEmptyStages();
  if (historySnapshot.exists()) processHistory(stagesData, historySnapshot.val(), batchStartTime);
  if (capturesSnapshot.exists()) await processCaptures(stagesData, capturesSnapshot.val(), batchStartTime);

  const { avgTemp, avgHumidity, avgMoisture, dataPoints } = calcAverages(stagesData);

  const batchData = {
    name,
    notes,
    createdAt:   batchStartTime,
    status:      'Active',
    quality:     'Pending',
    avgTemp,
    avgHumidity,
    avgMoisture,
    dataPoints,
    startDate:   new Date(batchStartTime).toISOString(),
    stagesData,
  };

  const newBatchRef = push(ref(db, `batches/${userId}`));
  await set(newBatchRef, batchData);
  return batchData;
};
