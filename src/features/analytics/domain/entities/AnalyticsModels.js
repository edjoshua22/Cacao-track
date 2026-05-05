/**
 * @file ChartSeries.js
 * @description JSON-serializable value object representing a ready-to-render chart dataset.
 */
export class ChartSeries {
  /**
   * @param {object} params
   * @param {string[]} params.labels
   * @param {number[]} params.tempDHT1
   * @param {number[]} params.tempDHT2
   * @param {number[]} params.humidDHT1
   * @param {number[]} params.humidDHT2
   * @param {number[]} params.moisture
   * @param {number}   params.count    Total source entries (before sampling)
   */
  constructor({ labels, tempDHT1, tempDHT2, humidDHT1, humidDHT2, moisture, count }) {
    this.labels    = labels;
    this.tempDHT1  = tempDHT1;
    this.tempDHT2  = tempDHT2;
    this.humidDHT1 = humidDHT1;
    this.humidDHT2 = humidDHT2;
    this.moisture  = moisture;
    this.count     = count;
  }

  get isEmpty() {
    return this.labels.length === 0;
  }

  static fromJson(json) {
    return new ChartSeries(json);
  }

  toJson() {
    return {
      labels:    this.labels,
      tempDHT1:  this.tempDHT1,
      tempDHT2:  this.tempDHT2,
      humidDHT1: this.humidDHT1,
      humidDHT2: this.humidDHT2,
      moisture:  this.moisture,
      count:     this.count,
    };
  }
}

/**
 * @file SensorStats.js (inlined)
 * @description Immutable stats snapshot for a set of sensor readings.
 */
export class SensorStats {
  constructor({ tempAvg, tempMin, tempMax, humidAvg, humidMin, humidMax, moistAvg, moistMin, moistMax, total }) {
    this.tempAvg  = tempAvg;
    this.tempMin  = tempMin;
    this.tempMax  = tempMax;
    this.humidAvg = humidAvg;
    this.humidMin = humidMin;
    this.humidMax = humidMax;
    this.moistAvg = moistAvg;
    this.moistMin = moistMin;
    this.moistMax = moistMax;
    this.total    = total;
  }

  static empty() {
    return new SensorStats({ tempAvg:0, tempMin:0, tempMax:0, humidAvg:0, humidMin:0, humidMax:0, moistAvg:0, moistMin:0, moistMax:0, total:0 });
  }

  toJson() { return { ...this }; }
  static fromJson(j) { return new SensorStats(j); }
}

/**
 * @file DayGroup.js (inlined)
 * @description One calendar-day bucket: its date string, the normalized entries, series and stats.
 */
export class DayGroup {
  /**
   * @param {object} params
   * @param {string}       params.dateKey
   * @param {SensorEntry[]}params.entries
   * @param {ChartSeries}  params.series
   * @param {SensorStats}  params.stats
   */
  constructor({ dateKey, entries, series, stats }) {
    this.dateKey = dateKey;
    this.entries = entries;
    this.series  = series;
    this.stats   = stats;
  }

  get hasData() { return this.entries.length > 0; }
}
