/**
 * @file ExportBatchImageUseCase.js
 * @description Optimized image export use case — migrated from utils/imageExportUtils.js.
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';
import * as Sharing from 'expo-sharing';
import * as Print   from 'expo-print';
import { Alert }    from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';
import { calculateFermentationDay, safeParseTimestamp } from '../../../../core/utils/fermentationUtils';
import { logProductionError } from '../../../../core/utils/debugUtils';

let _isExporting = false;

export class ExportBatchImageUseCase extends UseCase {
  constructor() { super(); }

  /**
   * Export all timeline images to a PDF and share it.
   * @returns {Promise<{ success: boolean, data?: null, error?: Failure }>}
   */
  async execute() {
    if (_isExporting) {
      Alert.alert('Please Wait', 'Export is already in progress.');
      return ok(null);
    }
    _isExporting = true;
    const startTime = Date.now();
    try {
      const db       = getDatabase(app);
      let snapshot;
      try {
        snapshot = await get(ref(db, 'captures'));
      } catch (firebaseError) {
        logProductionError(firebaseError, 'ExportBatchImageUseCase.FirebaseFetch');
        Alert.alert('Database Error', 'Failed to fetch images. Check your connection.');
        return fail(new Failure(firebaseError.message, firebaseError));
      }
      if (!snapshot.exists()) { Alert.alert('No Images', 'No timeline images found.'); return ok(null); }

      const imageEntries = Object.entries(snapshot.val());
      if (!imageEntries.length) { Alert.alert('No Images', 'No timeline images found.'); return ok(null); }

      Alert.alert('Exporting Images', `Found ${imageEntries.length} images. Processing...`, [], { cancelable: false });

      // Group by day, limit 50 per day
      const imagesByDay = {};
      imageEntries.forEach(([timestamp, url]) => {
        try {
          const { dayKey, stageName, dayNumber } = calculateFermentationDay(timestamp);
          if (dayNumber <= 6) {
            if (!imagesByDay[dayKey]) imagesByDay[dayKey] = [];
            imagesByDay[dayKey].push({ timestamp, url, dayNumber, stageName });
          }
        } catch (e) { logProductionError(e, `ExportBatchImageUseCase.Process.${timestamp}`); }
      });

      const limitedImages = [];
      Object.keys(imagesByDay).forEach((day) => {
        const sorted = imagesByDay[day].sort((a, b) => {
          const tA = safeParseTimestamp(a.timestamp); const tB = safeParseTimestamp(b.timestamp);
          if (!tA && !tB) return 0; if (!tA) return 1; if (!tB) return -1;
          return tA.getTime() - tB.getTime();
        });
        limitedImages.push(...sorted.slice(0, 50));
      });

      const pdfImages = limitedImages
        .map((img) => ({ ...img, parsedDate: safeParseTimestamp(img.timestamp) }))
        .sort((a, b) => (a.parsedDate?.getTime() || 0) - (b.parsedDate?.getTime() || 0));

      if (!pdfImages.length) { Alert.alert('No Images', 'No images after processing.'); return ok(null); }

      const rowsHtml = [];
      for (let i = 0; i < pdfImages.length; i += 2) {
        const row = pdfImages.slice(i, i + 2);
        rowsHtml.push(`<div style="display:flex;justify-content:space-around;margin-bottom:15px;">
          ${row.map((img) => `<div style="width:45%;text-align:center;">
            <img src="${img.url}" style="width:100%;height:120px;object-fit:cover;border-radius:5px;margin-bottom:5px;"/>
            <div style="padding:5px;background:#f5e9dd;border-radius:5px;font-size:10px;"><strong>Day ${img.dayNumber}</strong><br/><span style="color:#666;font-size:9px;">${img.stageName}</span></div>
          </div>`).join('')}
        </div>`);
      }

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:20px;color:#333;background:#fff8f0;}h1{color:#5b3a29;text-align:center;margin-bottom:20px;}</style></head>
      <body><h1>📸 CacaoTrack Images</h1><p><strong>Total Images:</strong> ${pdfImages.length}</p>${rowsHtml.join('')}</body></html>`;

      let file;
      try {
        file = await Print.printToFileAsync({ html, base64: false, width: 612, height: 792 });
      } catch (printError) {
        logProductionError(printError, 'ExportBatchImageUseCase.PDF');
        Alert.alert('PDF Error', 'Failed to generate PDF. Please try again.');
        return fail(new Failure(printError.message, printError));
      }

      try {
        await Sharing.shareAsync(file.uri, { dialogTitle: 'Share Images PDF', UTI: 'com.adobe.pdf' });
      } catch (shareError) {
        logProductionError(shareError, 'ExportBatchImageUseCase.Share');
        Alert.alert('Share Error', 'PDF created but could not be shared.');
      }

      const totalTime = Date.now() - startTime;
      Alert.alert('Success', `PDF with ${pdfImages.length} images created in ${(totalTime / 1000).toFixed(1)}s.`);
      return ok(null);
    } catch (error) {
      logProductionError(error, 'ExportBatchImageUseCase.General');
      Alert.alert('Export Error', error.message || 'Unable to export images PDF.');
      return fail(new Failure(error.message, error));
    } finally {
      _isExporting = false;
    }
  }
}
