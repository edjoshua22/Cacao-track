/**
 * @file useFermentationHistory.js
 * @description Hook for FermentationHistoryScreen.
 * All Firebase and business logic is isolated in the use case and repository layers.
 */
import { useState, useEffect, useCallback } from 'react';
import container from '../../../../core/di/container';

const DAY_MS = 24 * 60 * 60 * 1000;
const STAGES = [
  { name: 'Fresh',                color: '#8B5A2B', icon: 'leaf-outline' },
  { name: 'Anaerobic',            color: '#7C3AED', icon: 'flask-outline' },
  { name: 'Anaerobic / Alcoholic',color: '#3B82F6', icon: 'beaker-outline' },
  { name: 'Aerobic',              color: '#10B981', icon: 'sunny-outline' },
  { name: 'Aerobic',              color: '#10B981', icon: 'sunny-outline' },
  { name: 'Maturation',           color: '#F59E0B', icon: 'time-outline' },
  { name: 'Drying Ready',         color: '#EF4444', icon: 'checkmark-circle-outline' },
];

function buildDayBuckets(batchData) {
  const days = STAGES.map((s) => ({ stageName: s.name, sensorData: [] }));
  if (!batchData.sensorData) return days;
  const startTime = parseInt(batchData.createdAt || batchData.startTime || Date.now());
  const entries = Array.isArray(batchData.sensorData)
    ? batchData.sensorData
    : Object.values(batchData.sensorData);
  entries.forEach((entry) => {
    if (!entry?.time) return;
    let t = entry.timestamp;
    if (!t) { const p = new Date(entry.time.replace(/-/g,'/')).getTime(); t = isNaN(p) ? startTime : p; }
    let idx = Math.floor((t - startTime) / DAY_MS);
    if (idx < 0) idx = 0; if (idx > 6) idx = 6;
    days[idx].sensorData.push(entry);
  });
  days.forEach((day) => day.sensorData.sort((a, b) => {
    const tA = a.timestamp || new Date(a.time.replace(/-/g,'/')).getTime();
    const tB = b.timestamp || new Date(b.time.replace(/-/g,'/')).getTime();
    return tA - tB;
  }));
  return days;
}

/**
 * @returns {{ batches: object[], selectedId: string|null, days: object[]|null, stages: object[], isLoadingBatches: boolean, isLoadingDays: boolean, selectBatch: Function }}
 */
export const useFermentationHistory = () => {
  const [batches,         setBatches]         = useState([]);
  const [selectedId,      setSelectedId]      = useState(null);
  const [days,            setDays]            = useState(null);
  const [isLoadingBatches,setIsLoadingBatches]= useState(true);
  const [isLoadingDays,   setIsLoadingDays]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const useCase = container.resolve('getFermentationHistoryUseCase');
        const result  = await useCase.execute();
        if (cancelled) return;
        if (result.success && result.data.length > 0) {
          const list = result.data.sort((a, b) => parseInt(b.createdAt||0) - parseInt(a.createdAt||0));
          setBatches(list);
          setSelectedId(list[0].id);
          setDays(buildDayBuckets(list[0].raw));
        } else {
          setBatches([]);
        }
      } catch (e) {
        console.warn('useFermentationHistory load error', e);
      } finally {
        if (!cancelled) setIsLoadingBatches(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const selectBatch = useCallback((batch) => {
    if (batch.id === selectedId) return;
    setSelectedId(batch.id);
    setIsLoadingDays(true);
    setTimeout(() => { setDays(buildDayBuckets(batch.raw)); setIsLoadingDays(false); }, 150);
  }, [selectedId]);

  return { batches, selectedId, days, stages: STAGES, isLoadingBatches, isLoadingDays, selectBatch };
};
