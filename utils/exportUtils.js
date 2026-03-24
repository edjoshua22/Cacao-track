// utils/exportUtils.js
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebaseConfig";
import { 
  safeParseTimestamp, 
  calculateFermentationDay 
} from "./fermentationUtils";
import { logProductionError } from "./debugUtils";
import { inferImage } from "./inferImage";

const DAY_MS = 24 * 60 * 60 * 1000;

// Parse timestamp format: YYYY-MM-DD_HH-MM-SS or YYYYMMDD_HHMMSS
const parseCaptureTimestamp = (timestampStr) => {
  try {
    let datePart, timePart;
    
    if (timestampStr.includes('_')) {
      if (timestampStr.includes('-')) {
        // Format: YYYY-MM-DD_HH-MM-SS
        [datePart, timePart] = timestampStr.split("_");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Format: YYYYMMDD_HHMMSS
        [datePart, timePart] = timestampStr.split("_");
        const year = parseInt(datePart.substring(0, 4));
        const month = parseInt(datePart.substring(4, 6));
        const day = parseInt(datePart.substring(6, 8));
        const hour = parseInt(timePart.substring(0, 2));
        const minute = parseInt(timePart.substring(2, 4));
        const second = parseInt(timePart.substring(4, 6));
        return new Date(year, month - 1, day, hour, minute, second);
      }
    } else {
      // Format: YYYY-MM-DD or try other formats
      return new Date(timestampStr);
    }
  } catch (error) {
    return null;
  }
};

// Build per-day stages data for a batch
async function buildStagesData(batch) {
  const db = getDatabase(app);

  const stagesData = {
    day0: { sensorData: [], images: [], stageName: "Fresh" },
    day1: { sensorData: [], images: [], stageName: "Anaerobic" },
    day2: { sensorData: [], images: [], stageName: "Anaerobic / Alcoholic" },
    day3: { sensorData: [], images: [], stageName: "Aerobic" },
    day4: { sensorData: [], images: [], stageName: "Aerobic" },
    day5: { sensorData: [], images: [], stageName: "Maturation" },
    day6: { sensorData: [], images: [], stageName: "Drying Ready" },
  };

  const start = batch.createdAt || 0;
  const end = batch.completedAt || Date.now();
  const allReadings = [];

  // 1) Get sensor data from multiple Firebase sources like MonitoringScreen
  let sensorEntries = Array.isArray(batch.relevantData)
    ? batch.relevantData
    : [];

  if (!sensorEntries.length) {
    // Get data directly from sensorData node
    const sensorDataSnap = await get(ref(db, "sensorData"));
    
    if (sensorDataSnap.exists()) {
      const sensorData = sensorDataSnap.val();
      sensorEntries = Object.entries(sensorData)
        .map(([timestampKey, val]) => {
          // Parse timestamp key (e.g., "20260107_154547")
          const t = parseCaptureTimestamp(timestampKey);
          if (!t) {
            return null;
          }
          const timestamp = t.getTime();
          
          // Remove date filtering - process all sensor data

          const temperature = parseFloat(val.tempDHT1 || val.temp1 || val.temp || val.temperature) || 0;
          const humidity = parseFloat(val.humidDHT1 || val.humidity1 || val.humidity) || 0;
          const moisture = parseFloat(val.soilMoisture) || 0;

          return {
            timestamp,
            temperature,
            humidity,
            moisture,
            time: val.time || new Date(timestamp).toLocaleString(),
          };
        })
        .filter(Boolean);
    }
  }

  sensorEntries.forEach((entry) => {
    const t = entry.timestamp || 0;
    if (!t) return;

    const reading = {
      timestamp: t,
      temperature: entry.temperature,
      humidity: entry.humidity,
      moisture: entry.moisture,
      time: entry.time || new Date(t).toLocaleString(),
    };

    allReadings.push(reading);

    // Use dynamic fermentation day calculation
    try {
      const fermentationInfo = calculateFermentationDay(t.toString());
      const dayKey = fermentationInfo.dayKey;

      if (stagesData[dayKey]) {
        stagesData[dayKey].sensorData.push(reading);
      }
    } catch (error) {
      logProductionError(error, `exportUtils.buildStagesData.Sensor.${t}`);
      // Skip problematic readings but continue processing
    }
  });

  stagesData.allReadings = allReadings.sort((a, b) => a.timestamp - b.timestamp);

  // 2) Images
  const capturesSnap = await get(ref(db, "captures"));
  if (capturesSnap.exists()) {
    const captures = capturesSnap.val();
    const captureEntries = Object.entries(captures);

    const imagePromises = captureEntries.map(async ([timestampStr, url]) => {
      const date = parseCaptureTimestamp(timestampStr);
      if (!date) return null;
      const t = date.getTime();
      // Remove date filtering for images - process all images
      
      // Skip AI inference completely for speed
      const stage = null;

      return {
        timestamp: t,
        url,
        stage,
        timestampStr,
      };
    });

    const classified = await Promise.all(imagePromises);
    const allImages = classified.filter(Boolean);
    
    // Sort all images by timestamp (oldest first)
    allImages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Assign images using dynamic fermentation day calculation
    allImages.forEach((image) => {
      try {
        const fermentationInfo = calculateFermentationDay(image.timestamp.toString());
        const dayKey = fermentationInfo.dayKey;

        if (stagesData[dayKey]) {
          stagesData[dayKey].images.push({
            timestamp: image.timestamp,
            url: image.url,
            stage: fermentationInfo.stageName,
            timestampStr: image.timestampStr,
          });
        }
      } catch (error) {
        logProductionError(error, `exportUtils.buildStagesData.Image.${image.timestamp}`);
        // Skip problematic images but continue processing
      }
    });
    
    stagesData.allImages = allImages.sort((a, b) => a.timestamp - b.timestamp);
  }

  return stagesData;
}

// Export batch data to CSV
export async function exportCSV(batch) {
  try {
    const stagesData = await buildStagesData(batch);

    const safeName = batch.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeName}_Fermentation_Report.csv`;

    let csvContent = `CacaoTrack Fermentation Report\n`;
    csvContent += `Batch Name,${batch.name}\n`;
    csvContent += `Status,${batch.status}\n`;
    csvContent += `Quality,${batch.quality}\n`;
    csvContent += `Created At,${new Date(batch.createdAt).toLocaleString()}\n`;
    if (batch.completedAt)
      csvContent += `Completed At,${new Date(batch.completedAt).toLocaleString()}\n`;
    csvContent += `Overall Average Temp (°C),${batch.avgTemp.toFixed(1)}\n`;
    csvContent += `Overall Average Humidity (%),${batch.avgHumidity.toFixed(1)}\n`;
    csvContent += `Overall Average Moisture (%),${batch.avgMoisture.toFixed(1)}\n`;
    csvContent += `Total Data Points,${batch.dataPoints}\n`;
    if (batch.notes) csvContent += `Notes,${batch.notes}\n`;
    csvContent += `\n`;

    const stages = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];
    const stageNames = {
      day0: 'Day 0 - Fresh',
      day1: 'Day 1 - Anaerobic',
      day2: 'Day 2 - Anaerobic / Alcoholic',
      day3: 'Day 3 - Aerobic',
      day4: 'Day 4 - Aerobic',
      day5: 'Day 5 - Maturation',
      day6: 'Day 6 - Drying Ready'
    };

    stages.forEach((dayKey) => {
      const stage = stagesData[dayKey];
      if (!stage) return;

      csvContent += `\n=== ${stageNames[dayKey]} ===\n`;
      csvContent += `Stage Name,${stage.stageName || dayKey}\n`;
      csvContent += `Sensor Readings Count,${stage.sensorData?.length || 0}\n`;
      csvContent += `Images Count,${stage.images?.length || 0}\n`;

      if (stage.sensorData && stage.sensorData.length > 0) {
        const avgTemp = stage.sensorData.reduce((sum, d) => sum + d.temperature, 0) / stage.sensorData.length;
        const avgHumidity = stage.sensorData.reduce((sum, d) => sum + d.humidity, 0) / stage.sensorData.length;
        const avgMoisture = stage.sensorData.reduce((sum, d) => sum + d.moisture, 0) / stage.sensorData.length;

        csvContent += `Average Temperature (°C),${avgTemp.toFixed(2)}\n`;
        csvContent += `Average Humidity (%),${avgHumidity.toFixed(2)}\n`;
        csvContent += `Average Moisture (%),${avgMoisture.toFixed(2)}\n\n`;

        csvContent += `Timestamp,Time,Temperature (°C),Humidity (%),Moisture (%)\n`;
        stage.sensorData
          .sort((a, b) => a.timestamp - b.timestamp)
          .forEach((entry) => {
            const ts = new Date(entry.timestamp).toLocaleString();
            csvContent += `${ts},${entry.time || ts},${entry.temperature.toFixed(2)},${entry.humidity.toFixed(2)},${entry.moisture.toFixed(2)}\n`;
          });
      } else {
        // Add placeholder averages for stages with no sensor data
        csvContent += `Average Temperature (°C),No data\n`;
        csvContent += `Average Humidity (%),No data\n`;
        csvContent += `Average Moisture (%),No data\n\n`;
      }

      if (stage.images && stage.images.length > 0) {
        csvContent += `\nImage Timestamp,Image URL,Detected Stage\n`;
        stage.images.forEach((img) => {
          const imgTs = new Date(img.timestamp).toLocaleString();
          csvContent += `${imgTs},${img.url},${img.stage}\n`;
        });
      }

      csvContent += `\n`;
    });

    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: "utf8",
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Share Batch CSV Report",
      UTI: "public.comma-separated-values-text",
    });
  } catch (error) {
    if (__DEV__) {
      console.error("CSV Export Error:", error);
    }
    Alert.alert("Export Error", error.message || "Unable to export CSV file.");
  }
}

// Export batch data to PDF
export async function exportPDF(batch) {
  try {
    // Show loading indicator immediately
    Alert.alert("Generating PDF", "Creating fermentation report... This may take a moment.", [{ text: "OK" }]);
    
    const stagesData = await buildStagesData(batch);

    const stages = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];
    const stageNames = {
      day0: 'Day 0 - Fresh',
      day1: 'Day 1 - Anaerobic',
      day2: 'Day 2 - Anaerobic / Alcoholic',
      day3: 'Day 3 - Aerobic',
      day4: 'Day 4 - Aerobic',
      day5: 'Day 5 - Maturation',
      day6: 'Day 6 - Drying Ready'
    };

    let stagesHtml = '';
    stages.forEach((dayKey) => {
      const stage = stagesData[dayKey];
      if (!stage) return;

      const sensorCount = stage.sensorData?.length || 0;
      const imageCount = stage.images?.length || 0;

      // Always show the stage, even if empty
      let avgTemp = 0, avgHumidity = 0, avgMoisture = 0;
      let hasSensorData = false;
      
      if (sensorCount > 0) {
        avgTemp = stage.sensorData.reduce((sum, d) => sum + d.temperature, 0) / sensorCount;
        avgHumidity = stage.sensorData.reduce((sum, d) => sum + d.humidity, 0) / sensorCount;
        avgMoisture = stage.sensorData.reduce((sum, d) => sum + d.moisture, 0) / sensorCount;
        hasSensorData = true;
      }

      stagesHtml += `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #8B5A2B; margin-top: 0;">${stageNames[dayKey]}</h2>
          <p><strong>Stage:</strong> ${stage.stageName || dayKey}</p>
          <p><strong>Sensor Readings:</strong> ${sensorCount}</p>
          <p><strong>Images:</strong> ${imageCount}</p>
          ${hasSensorData ? `
          <p><strong>Average Temperature:</strong> ${avgTemp.toFixed(2)}°C</p>
          <p><strong>Average Humidity:</strong> ${avgHumidity.toFixed(2)}%</p>
          <p><strong>Average Moisture:</strong> ${avgMoisture.toFixed(2)}%</p>
          ` : `
          <p><strong>Average Temperature:</strong> No data</p>
          <p><strong>Average Humidity:</strong> No data</p>
          <p><strong>Average Moisture:</strong> No data</p>
          `}
        </div>
      `;
    });
    
    // Add section for ALL readings from batch start
    if (stagesData.allReadings && stagesData.allReadings.length > 0) {
      const allReadings = stagesData.allReadings;
      const totalReadings = allReadings.length;
      const avgTempAll = allReadings.reduce((sum, d) => sum + d.temperature, 0) / totalReadings;
      const avgHumidityAll = allReadings.reduce((sum, d) => sum + d.humidity, 0) / totalReadings;
      const avgMoistureAll = allReadings.reduce((sum, d) => sum + d.moisture, 0) / totalReadings;
      
      stagesHtml += `
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #8B5A2B; border-radius: 8px; background: #F5E9DD;">
          <h2 style="color: #8B5A2B; margin-top: 0;">📊 All Readings from Batch Start</h2>
          <p><strong>Total Readings:</strong> ${totalReadings}</p>
          <p><strong>Average Temperature:</strong> ${avgTempAll.toFixed(2)}°C</p>
          <p><strong>Average Humidity:</strong> ${avgHumidityAll.toFixed(2)}%</p>
          <p><strong>Average Moisture:</strong> ${avgMoistureAll.toFixed(2)}%</p>
          <p style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">This includes ALL sensor readings from the moment the batch was created, regardless of fermentation stage. Use this data to see complete trends and generate graphs.</p>
        </div>
      `;
    }
    
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #5B3A29; border-bottom: 2px solid #8B5A2B; padding-bottom: 10px; }
        .header { background: #F5E9DD; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #8B5A2B; color: white; }
      </style>
    </head>
    <body>
      <h1>CacaoTrack Fermentation Report</h1>
      
      <div class="header">
        <p><strong>Batch Name:</strong> ${batch.name}</p>
        <p><strong>Status:</strong> ${batch.status}</p>
        <p><strong>Quality:</strong> ${batch.quality}</p>
        <p><strong>Created:</strong> ${new Date(batch.createdAt).toLocaleString()}</p>
        ${batch.completedAt ? `<p><strong>Completed:</strong> ${new Date(batch.completedAt).toLocaleString()}</p>` : ''}
        ${batch.notes ? `<p><strong>Notes:</strong> ${batch.notes}</p>` : ''}
      </div>

      <div class="section">
        <h2 style="color: #8B5A2B;">Fermentation Stages (Day 0 - Day 6)</h2>
        ${stagesHtml || '<p>No stage data available.</p>'}
      </div>
    </body>
    </html>`;
    
    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  } catch (err) {
    Alert.alert("Export Error", err.message);
  }
}

// Export images only to PDF with Day and description
export async function exportImagesPDF() {
  try {
    const db = getDatabase(app);
    const capturesRef = ref(db, "captures");
    const snapshot = await get(capturesRef);
    
    if (!snapshot.exists()) {
      Alert.alert("No Images", "No timeline images found to export.");
      return;
    }

    const captures = snapshot.val();
    const imageEntries = Object.entries(captures);
    
    if (imageEntries.length === 0) {
      Alert.alert("No Images", "No timeline images found to export.");
      return;
    }

    // Show loading indicator
    Alert.alert("Processing", "Generating images PDF... This may take a moment.", [{ text: "OK" }]);

    // Process images using dynamic fermentation day calculation
    const imagesWithInfo = imageEntries.map(([timestamp, url]) => {
      try {
        const fermentationInfo = calculateFermentationDay(timestamp);
        const { dayKey, stageName } = fermentationInfo;
        
        return {
          timestamp,
          url,
          dayKey,
          stageName,
        };
      } catch (error) {
        logProductionError(error, `exportUtils.exportImagesPDF.${timestamp}`);
        // Return fallback data for problematic images
        return {
          timestamp,
          url,
          dayKey: 'day0',
          stageName: 'Unknown',
        };
      }
    });

    // Sort ALL images by timestamp
    imagesWithInfo.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Generate HTML for PDF with ALL images
    let imagesHtml = '';
    imagesWithInfo.forEach((image) => {
      imagesHtml += `
        <div style="margin-bottom: 40px; page-break-inside: avoid;">
          <div style="text-align: center; margin-bottom: 10px;">
            <img src="${image.url}" style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
          <div style="text-align: center; padding: 15px; background: #F5E9DD; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #8B5A2B; font-size: 18px; font-weight: 700;">Day ${image.dayNumber}</h3>
            <p style="margin: 0 0 5px 0; color: #5B3A29; font-size: 16px; font-weight: 600;">${image.stageName}</p>
            <p style="margin: 0; color: #666; font-size: 14px;">${image.date}</p>
          </div>
        </div>
      `;
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          color: #333; 
          background: #FFF8F0;
        }
        h1 { 
          color: #5B3A29; 
          border-bottom: 2px solid #8B5A2B; 
          padding-bottom: 10px; 
          text-align: center;
          margin-bottom: 30px;
        }
        .header { 
          background: #F5E9DD; 
          padding: 20px; 
          border-radius: 12px; 
          margin-bottom: 30px; 
          text-align: center;
          border: 2px solid #8B5A2B;
        }
      </style>
    </head>
    <body>
      <h1>📸 CacaoTrack All Timeline Images</h1>
      
      <div class="header">
        <p style="margin: 0; font-size: 16px; color: #5B3A29;"><strong>Total Images:</strong> ${imagesWithInfo.length}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Includes all images from Day 0, Day 1, and Day 2</p>
      </div>

      ${imagesHtml}
    </body>
    </html>`;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Share All Images PDF",
      UTI: "com.adobe.pdf",
    });
    
    Alert.alert("Success", `PDF with all ${imagesWithInfo.length} images created successfully.`);
  } catch (error) {
    if (__DEV__) {
      console.error("Images PDF Export Error:", error);
    }
    Alert.alert("Export Error", error.message || "Unable to export images PDF.");
  }
}
