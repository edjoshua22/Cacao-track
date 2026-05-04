/**
 * @file ChartSeriesFactory.js
 * @description Factory Method Pattern — each static method is a "factory method"
 * responsible for producing a ChartSeries of a specific type/scope.
 *
 * Factory Method: defines an interface for creating objects (ChartSeries) but
 * lets subclasses/methods decide which variant to instantiate.
 * The screen calls e.g. ChartSeriesFactory.overview(entries) and receives a
 * ready-to-render ChartSeries — no transformation logic in the UI layer.
 */
import { ChartSeries, SensorStats } from '../domain/entities/AnalyticsModels';

// ── Internal helpers ─────────────────────────────────────────────────────────
function _stats1(arr) {
  const v = arr.filter(x => x > 0);
  if (!v.length) return { min: 0, max: 0, avg: 0 };
  const sum = v.reduce((s, x) => s + x, 0);
  return { min: Math.min(...v), max: Math.max(...v), avg: sum / v.length };
}

function _buildSeries(entries) {
  return new ChartSeries({
    labels:    entries.map(e => e.timeLabel),
    tempDHT1:  entries.map(e => e.tempDHT1),
    tempDHT2:  entries.map(e => e.tempDHT2),
    humidDHT1: entries.map(e => e.humidDHT1),
    humidDHT2: entries.map(e => e.humidDHT2),
    moisture:  entries.map(e => e.moisture),
    count:     entries.length,
  });
}

// ── Factory class ─────────────────────────────────────────────────────────────
export class ChartSeriesFactory {
  /**
   * Factory Method — full history overview, downsampled to ≤maxPoints.
   * @param {SensorEntry[]} entries  Sorted ascending
   * @param {number}        maxPoints
   * @returns {ChartSeries}
   */
  static overview(entries, maxPoints = 60) {
    if (!entries.length) return ChartSeriesFactory._empty(0);
    const step    = Math.max(1, Math.ceil(entries.length / maxPoints));
    const sampled = entries.filter((_, i) => i % step === 0);
    return _buildSeries(sampled);
  }

  /**
   * Factory Method — single calendar-day chart, all readings for that day.
   * @param {SensorEntry[]} dayEntries  Already filtered for one date
   * @returns {ChartSeries}
   */
  static forDay(dayEntries) {
    if (!dayEntries.length) return ChartSeriesFactory._empty(0);
    return _buildSeries(dayEntries);
  }

  /**
   * Factory Method — compute aggregate stats across all entries.
   * @param {SensorEntry[]} entries
   * @returns {SensorStats}
   */
  static stats(entries) {
    if (!entries.length) return SensorStats.empty();
    const t1 = _stats1(entries.map(e => e.tempDHT1));
    const t2 = _stats1(entries.map(e => e.tempDHT2));
    const h1 = _stats1(entries.map(e => e.humidDHT1));
    const h2 = _stats1(entries.map(e => e.humidDHT2));
    const m  = _stats1(entries.map(e => e.moisture));

    // Merge DHT1+DHT2 for combined temp/humid stats
    const tAll = _stats1([...entries.map(e => e.tempDHT1),  ...entries.map(e => e.tempDHT2)]);
    const hAll = _stats1([...entries.map(e => e.humidDHT1), ...entries.map(e => e.humidDHT2)]);

    return new SensorStats({
      tempAvg:  tAll.avg, tempMin:  tAll.min, tempMax:  tAll.max,
      humidAvg: hAll.avg, humidMin: hAll.min, humidMax: hAll.max,
      moistAvg: m.avg,    moistMin: m.min,    moistMax: m.max,
      total:    entries.length,
    });
  }

  /**
   * Factory Method — group entries by calendar date, return up to maxDays.
   * @param {SensorEntry[]} entries  Sorted ascending
   * @param {number}        maxDays  Cap at 7 for Day 0–6
   * @returns {Map<string, SensorEntry[]>}  dateKey → entries (most-recent maxDays)
   */
  static groupByDate(entries, maxDays = 7) {
    const map = new Map();
    for (const e of entries) {
      if (!e.dateKey) continue;
      if (!map.has(e.dateKey)) map.set(e.dateKey, []);
      map.get(e.dateKey).push(e);
    }
    // Sort ascending, keep only last maxDays
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return new Map(sorted.slice(-maxDays));
  }

  // ── private ─────────────────────────────────────────────────────────────────
  static _empty(count) {
    return new ChartSeries({ labels: [], tempDHT1: [], tempDHT2: [], humidDHT1: [], humidDHT2: [], moisture: [], count });
  }
}
