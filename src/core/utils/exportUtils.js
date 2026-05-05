/**
 * @file exportUtils.js
 * @description Batch export helpers (CSV, PDF, images PDF).
 * Migrated from utils/exportUtils.js — all original logic preserved.
 */
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../../firebaseConfig.secure';
import { calculateFermentationDay } from './fermentationUtils';
import { logProductionError } from './debugUtils';

/**
 * Parse capture timestamp string into Date.
 * @param {string} timestampStr
 * @returns {Date|null}
 */
const parseCaptureTimestamp = (timestampStr) => {
  try {
    if (timestampStr.includes('_')) {
      if (timestampStr.includes('-')) {
        const [datePart, timePart] = timestampStr.split('_');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
      } else {
        const [datePart, timePart] = timestampStr.split('_');
        return new Date(
          parseInt(datePart.substring(0, 4)),
          parseInt(datePart.substring(4, 6)) - 1,
          parseInt(datePart.substring(6, 8)),
          parseInt(timePart.substring(0, 2)),
          parseInt(timePart.substring(2, 4)),
          parseInt(timePart.substring(4, 6))
        );
      }
    }
    return new Date(timestampStr);
  } catch { return null; }
};

/**
 * Build per-day stages data for a batch.
 * @param {object} batch
 * @returns {Promise<object>}
 */
async function buildStagesData(batch) {
  const db = getDatabase(app);
  const stagesData = {
    day0: { sensorData: [], images: [], stageName: 'Fresh' },
    day1: { sensorData: [], images: [], stageName: 'Anaerobic' },
    day2: { sensorData: [], images: [], stageName: 'Anaerobic / Alcoholic' },
    day3: { sensorData: [], images: [], stageName: 'Aerobic' },
    day4: { sensorData: [], images: [], stageName: 'Aerobic' },
    day5: { sensorData: [], images: [], stageName: 'Maturation' },
    day6: { sensorData: [], images: [], stageName: 'Drying Ready' },
  };
  const allReadings = [];

  let sensorEntries = Array.isArray(batch.relevantData) ? batch.relevantData : [];
  if (!sensorEntries.length) {
    const snap = await get(ref(db, 'sensorData'));
    if (snap.exists()) {
      sensorEntries = Object.entries(snap.val())
        .map(([key, val]) => {
          const t = parseCaptureTimestamp(key);
          if (!t) return null;
          return {
            timestamp:   t.getTime(),
            temperature: parseFloat(val.tempDHT1 || val.temp1 || val.temp || val.temperature) || 0,
            humidity:    parseFloat(val.humidDHT1 || val.humidity1 || val.humidity) || 0,
            moisture:    parseFloat(val.soilMoisture) || 0,
            time:        val.time || new Date(t.getTime()).toLocaleString(),
          };
        })
        .filter(Boolean);
    }
  }

  sensorEntries.forEach((entry) => {
    const t = entry.timestamp || 0;
    if (!t) return;
    const reading = { timestamp: t, temperature: entry.temperature, humidity: entry.humidity, moisture: entry.moisture, time: entry.time || new Date(t).toLocaleString() };
    allReadings.push(reading);
    try {
      const { dayKey } = calculateFermentationDay(t.toString());
      if (stagesData[dayKey]) stagesData[dayKey].sensorData.push(reading);
    } catch (e) { logProductionError(e, `exportUtils.buildStagesData.Sensor.${t}`); }
  });

  stagesData.allReadings = allReadings.sort((a, b) => a.timestamp - b.timestamp);

  const capturesSnap = await get(ref(db, 'captures'));
  if (capturesSnap.exists()) {
    const allImages = Object.entries(capturesSnap.val())
      .map(([timestampStr, url]) => {
        const date = parseCaptureTimestamp(timestampStr);
        if (!date) return null;
        return { timestamp: date.getTime(), url, stage: null, timestampStr };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);

    allImages.forEach((image) => {
      try {
        const { dayKey, stageName } = calculateFermentationDay(image.timestamp.toString());
        if (stagesData[dayKey]) {
          stagesData[dayKey].images.push({ timestamp: image.timestamp, url: image.url, stage: stageName, timestampStr: image.timestampStr });
        }
      } catch (e) { logProductionError(e, `exportUtils.buildStagesData.Image.${image.timestamp}`); }
    });
    stagesData.allImages = allImages;
  }

  return stagesData;
}

const STAGE_NAMES = {
  day0: 'Day 0 - Fresh', day1: 'Day 1 - Anaerobic', day2: 'Day 2 - Anaerobic / Alcoholic',
  day3: 'Day 3 - Aerobic', day4: 'Day 4 - Aerobic', day5: 'Day 5 - Maturation', day6: 'Day 6 - Drying Ready',
};
const STAGES = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];

/**
 * Export batch data as CSV.
 * @param {object} batch
 * @returns {Promise<void>}
 */
export async function exportCSV(batch) {
  try {
    const stagesData = await buildStagesData(batch);
    const safeName   = batch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName   = `${safeName}_Fermentation_Report.csv`;

    let csv = `CacaoTrack Fermentation Report\nBatch Name,${batch.name}\nStatus,${batch.status}\nQuality,${batch.quality}\n`;
    csv += `Created At,${new Date(batch.createdAt).toLocaleString()}\n`;
    if (batch.completedAt) csv += `Completed At,${new Date(batch.completedAt).toLocaleString()}\n`;
    csv += `Overall Average Temp (°C),${batch.avgTemp.toFixed(1)}\nOverall Average Humidity (%),${batch.avgHumidity.toFixed(1)}\n`;
    csv += `Overall Average Moisture (%),${batch.avgMoisture.toFixed(1)}\nTotal Data Points,${batch.dataPoints}\n`;
    if (batch.notes) csv += `Notes,${batch.notes}\n`;
    csv += '\n';

    STAGES.forEach((dayKey) => {
      const stage = stagesData[dayKey];
      if (!stage) return;
      csv += `\n=== ${STAGE_NAMES[dayKey]} ===\nStage Name,${stage.stageName || dayKey}\n`;
      csv += `Sensor Readings Count,${stage.sensorData?.length || 0}\nImages Count,${stage.images?.length || 0}\n`;
      if (stage.sensorData?.length > 0) {
        const avg = (arr, key) => arr.reduce((s, d) => s + d[key], 0) / arr.length;
        csv += `Average Temperature (°C),${avg(stage.sensorData, 'temperature').toFixed(2)}\n`;
        csv += `Average Humidity (%),${avg(stage.sensorData, 'humidity').toFixed(2)}\n`;
        csv += `Average Moisture (%),${avg(stage.sensorData, 'moisture').toFixed(2)}\n\n`;
        csv += `Timestamp,Time,Temperature (°C),Humidity (%),Moisture (%)\n`;
        stage.sensorData.sort((a, b) => a.timestamp - b.timestamp).forEach((e) => {
          const ts = new Date(e.timestamp).toLocaleString();
          csv += `${ts},${e.time || ts},${e.temperature.toFixed(2)},${e.humidity.toFixed(2)},${e.moisture.toFixed(2)}\n`;
        });
      } else {
        csv += `Average Temperature (°C),No data\nAverage Humidity (%),No data\nAverage Moisture (%),No data\n\n`;
      }
      if (stage.images?.length > 0) {
        csv += `\nImage Timestamp,Image URL,Detected Stage\n`;
        stage.images.forEach((img) => { csv += `${new Date(img.timestamp).toLocaleString()},${img.url},${img.stage}\n`; });
      }
      csv += '\n';
    });

    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Share Batch CSV Report', UTI: 'public.comma-separated-values-text' });
  } catch (error) {
    if (__DEV__) console.error('CSV Export Error:', error);
    Alert.alert('Export Error', error.message || 'Unable to export CSV file.');
  }
}

/**
 * Export batch data as PDF.
 * @param {object} batch
 * @returns {Promise<void>}
 */
export async function exportPDF(batch) {
  try {
    Alert.alert('Generating PDF', 'Creating fermentation report... This may take a moment.', [{ text: 'OK' }]);
    const stagesData = await buildStagesData(batch);
    let stagesHtml = '';

    STAGES.forEach((dayKey) => {
      const stage = stagesData[dayKey];
      if (!stage) return;
      const sc = stage.sensorData?.length || 0;
      const ic = stage.images?.length || 0;
      let aT = 0, aH = 0, aM = 0, hasData = false;
      if (sc > 0) {
        aT = stage.sensorData.reduce((s, d) => s + d.temperature, 0) / sc;
        aH = stage.sensorData.reduce((s, d) => s + d.humidity, 0) / sc;
        aM = stage.sensorData.reduce((s, d) => s + d.moisture, 0) / sc;
        hasData = true;
      }
      stagesHtml += `<div style="margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:8px;">
        <h2 style="color:#8B5A2B;margin-top:0;">${STAGE_NAMES[dayKey]}</h2>
        <p><b>Stage:</b> ${stage.stageName || dayKey}</p><p><b>Sensor Readings:</b> ${sc}</p><p><b>Images:</b> ${ic}</p>
        ${hasData ? `<p><b>Avg Temp:</b> ${aT.toFixed(2)}°C</p><p><b>Avg Humidity:</b> ${aH.toFixed(2)}%</p><p><b>Avg Moisture:</b> ${aM.toFixed(2)}%</p>` : `<p><b>Avg Temp:</b> No data</p><p><b>Avg Humidity:</b> No data</p><p><b>Avg Moisture:</b> No data</p>`}
      </div>`;
    });

    if (stagesData.allReadings?.length > 0) {
      const ar = stagesData.allReadings;
      stagesHtml += `<div style="margin:20px 0;padding:15px;border:2px solid #8B5A2B;border-radius:8px;background:#F5E9DD;">
        <h2 style="color:#8B5A2B;margin-top:0;">📊 All Readings from Batch Start</h2>
        <p><b>Total Readings:</b> ${ar.length}</p>
        <p><b>Avg Temp:</b> ${(ar.reduce((s, d) => s + d.temperature, 0) / ar.length).toFixed(2)}°C</p>
      </div>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#5B3A29;border-bottom:2px solid #8B5A2B;padding-bottom:10px}.header{background:#F5E9DD;padding:15px;border-radius:8px;margin-bottom:20px}</style></head>
    <body><h1>CacaoTrack Fermentation Report</h1>
    <div class="header"><p><b>Batch Name:</b> ${batch.name}</p><p><b>Status:</b> ${batch.status}</p><p><b>Quality:</b> ${batch.quality}</p><p><b>Created:</b> ${new Date(batch.createdAt).toLocaleString()}</p>${batch.notes ? `<p><b>Notes:</b> ${batch.notes}</p>` : ''}</div>
    <div><h2 style="color:#8B5A2B;">Fermentation Stages</h2>${stagesHtml}</div></body></html>`;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  } catch (err) { Alert.alert('Export Error', err.message); }
}

/**
 * Export all timeline images as a PDF.
 * @returns {Promise<void>}
 */
export async function exportImagesPDF() {
  try {
    const db = getDatabase(app);
    const snapshot = await get(ref(db, 'captures'));
    if (!snapshot.exists()) { Alert.alert('No Images', 'No timeline images found.'); return; }
    const imageEntries = Object.entries(snapshot.val());
    if (!imageEntries.length) { Alert.alert('No Images', 'No timeline images found.'); return; }

    Alert.alert('Processing', 'Generating images PDF...', [{ text: 'OK' }]);

    const imagesWithInfo = imageEntries.map(([timestamp, url]) => {
      try {
        const { dayKey, stageName } = calculateFermentationDay(timestamp);
        return { timestamp, url, dayKey, stageName };
      } catch (e) {
        logProductionError(e, `exportImagesPDF.${timestamp}`);
        return { timestamp, url, dayKey: 'day0', stageName: 'Unknown' };
      }
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let imagesHtml = '';
    imagesWithInfo.forEach((img) => {
      imagesHtml += `<div style="margin-bottom:40px;page-break-inside:avoid;text-align:center;">
        <img src="${img.url}" style="max-width:100%;max-height:300px;object-fit:contain;border-radius:8px;" />
        <div style="padding:15px;background:#F5E9DD;border-radius:8px;margin-top:10px;">
          <h3 style="color:#8B5A2B;">${img.stageName}</h3><p style="color:#666;">${img.timestamp}</p>
        </div></div>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:20px;background:#FFF8F0;}h1{color:#5B3A29;text-align:center;}</style></head>
    <body><h1>📸 CacaoTrack All Timeline Images</h1><p style="text-align:center;"><b>Total:</b> ${imagesWithInfo.length} — Generated: ${new Date().toLocaleString()}</p>${imagesHtml}</body></html>`;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri, { dialogTitle: 'Share All Images PDF', UTI: 'com.adobe.pdf' });
    Alert.alert('Success', `PDF with ${imagesWithInfo.length} images created.`);
  } catch (error) {
    if (__DEV__) console.error('Images PDF Export Error:', error);
    Alert.alert('Export Error', error.message || 'Unable to export images PDF.');
  }
}
