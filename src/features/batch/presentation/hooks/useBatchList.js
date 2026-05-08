/**
 * @file useBatchList.js
 * @description Hook that resolves use cases from the DI container and manages batch list state.
 * The screen remains completely dumb — it only consumes this hook.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import container from '../../../../core/di/container';
import { mapBatchToViewModel } from '../viewmodels/BatchViewModel';

const DAY_MS = 24 * 60 * 60 * 1000;

function toEpochMs(v, fallback = Date.now()) {
  if (v == null) return fallback;
  if (typeof v === 'number' && isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return fallback;
  if (/^\d+$/.test(s)) return Number(s);
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Process raw batch Firebase data into day buckets (day0–day6) for analytics.
 * @param {object} batchData
 * @param {string} batchId
 * @param {number} endTime - The start time of the next batch (or Infinity if this is the latest batch)
 * @returns {object} Processed batch with day buckets.
 */
function processBatchData(batchData, batchId, endTime = Infinity) {
  try {
    const processedBatch = {
      id: batchId,
      ...batchData,
      relevantData: [],
      day0: { stageName: 'Fresh',                sensorData: [] },
      day1: { stageName: 'Anaerobic',            sensorData: [] },
      day2: { stageName: 'Anaerobic / Alcoholic', sensorData: [] },
      day3: { stageName: 'Aerobic',              sensorData: [] },
      day4: { stageName: 'Aerobic',              sensorData: [] },
      day5: { stageName: 'Maturation',           sensorData: [] },
      day6: { stageName: 'Drying Ready',         sensorData: [] },
    };

    if (batchData.sensorData) {
      const startTime = toEpochMs(batchData.createdAt || batchData.startTime, Date.now());
      const sensorEntries = Array.isArray(batchData.sensorData)
        ? batchData.sensorData
        : Object.values(batchData.sensorData);

      sensorEntries.forEach((entry) => {
        if (!entry || !entry.time) return;
        let entryTime = entry.timestamp;
        if (!entryTime) {
          let cleanTime = String(entry.time).replace(/_/g, ' ');
          if (cleanTime.includes(' ')) {
            const parts = cleanTime.split(' ');
            const datePart = parts[0].replace(/-/g, '/');
            const timePart = parts[1].replace(/-/g, ':');
            cleanTime = `${datePart} ${timePart}`;
          } else {
            cleanTime = cleanTime.replace(/-/g, '/');
          }
          const parsed = new Date(cleanTime).getTime();
          entryTime = isNaN(parsed) ? 0 : parsed;
        }
        
        // Ensure data belongs strictly to this batch's timeline
        if (entryTime >= startTime && entryTime < endTime) {
          let dayIndex = Math.floor((entryTime - startTime) / DAY_MS);
          if (dayIndex >= 0 && dayIndex <= 6) {
            const dayKey = `day${dayIndex}`;
            if (processedBatch[dayKey]) {
              processedBatch[dayKey].sensorData.push(entry);
            }
          }
        }
      });

      for (let i = 0; i <= 6; i++) {
        const dayKey = `day${i}`;
        processedBatch[dayKey].sensorData.sort((a, b) => {
          const tA = a.timestamp || new Date(a.time.replace(/-/g, '/')).getTime();
          const tB = b.timestamp || new Date(b.time.replace(/-/g, '/')).getTime();
          return tA - tB;
        });
      }
    }
    return processedBatch;
  } catch {
    return { id: batchId, ...batchData, relevantData: [] };
  }
}

/**
 * Hook providing the batch list with real-time Firebase updates.
 * @returns {{ batches: object[], isLoading: boolean, error: string|null, deleteBatch: Function, expandedBatchId: string|null, toggleExpand: Function }}
 */
export const useBatchList = () => {
  const [batches,         setBatches]         = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState(null);
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    const setup = async () => {
      try {
        const authService = container.resolve('authService');
        await authService.initialize();
        const userId = authService.getUserId();
        if (!userId) { setError('User not authenticated'); setIsLoading(false); return; }

        const batchRepo = container.resolve('batchRepository');
        unsubscribe = batchRepo.subscribeToUserBatches(userId, (entities) => {
          // Sort entities by createdAt descending so index 0 is the newest batch
          const sortedEntities = [...entities].sort((a, b) => {
            const timeA = toEpochMs(a.createdAt || a.startTime, 0);
            const timeB = toEpochMs(b.createdAt || b.startTime, 0);
            return timeB - timeA;
          });

          const processed = sortedEntities.map((e, index) => {
            const vm = mapBatchToViewModel(e);
            
            // The endTime for this batch is the startTime of the batch created AFTER it
            // Since sorted descending, the batch created after it is at index - 1
            const endTime = index > 0 
              ? toEpochMs(sortedEntities[index - 1].createdAt || sortedEntities[index - 1].startTime, Date.now())
              : Infinity;

            // Re-run day-bucket processing using the raw sensorData strictly within its time window
            if (e.sensorData) {
              const withBuckets = processBatchData(e, e.id, endTime);
              return { ...vm, ...withBuckets };
            }
            return vm;
          });
          setBatches(processed);
          setIsLoading(false);
          setError(null);
        });
      } catch (err) {
        setError('Failed to load batches');
        setIsLoading(false);
      }
    };

    setup();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => (parseInt(b.createdAt) || 0) - (parseInt(a.createdAt) || 0)),
    [batches]
  );

  const deleteBatch = useCallback(async (id, name) => {
    try {
      const authService = container.resolve('authService');
      await authService.initialize();
      const userId = authService.getUserId();
      if (!userId) throw new Error('Not authenticated');
      const batchRepo = container.resolve('batchRepository');
      await batchRepo.deleteBatch(userId, id);
    } catch (err) {
      throw err;
    }
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedBatchId((prev) => (prev === id ? null : id));
  }, []);

  return { batches: sortedBatches, isLoading, error, deleteBatch, expandedBatchId, toggleExpand };
};
