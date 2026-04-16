// utils/imageExportUtils.js
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Alert } from "react-native";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebaseConfig";
import { 
  safeParseTimestamp, 
  calculateFermentationDay,
  safeSortByTimestamp 
} from "../utils/fermentationUtils";
import { logProductionError } from "../utils/debugUtils";


// Prevent multiple simultaneous exports
let isExporting = false;

// Optimized image export function - smaller PDF with day and description
export async function exportImagesPDFOptimized() {
  if (isExporting) {
    Alert.alert("Please Wait", "Export is already in progress. Please wait for it to complete.");
    return;
  }
  
  isExporting = true;
  const startTime = Date.now();
  
  try {
    const firebaseStart = Date.now();
    const db = getDatabase(app);
    const capturesRef = ref(db, "captures");
    
    let snapshot;
    try {
      snapshot = await get(capturesRef);
    } catch (firebaseError) {
      logProductionError(firebaseError, 'imageExportUtils.FirebaseFetch');
      Alert.alert("Database Error", "Failed to fetch images from database. Please check your connection.");
      return;
    }
    
    const firebaseTime = Date.now() - firebaseStart;
    
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

    // Show loading alert after Firebase fetch completes
    Alert.alert("Exporting Images", `Found ${imageEntries.length} images. Processing...`, [], { cancelable: false });

    // Process images and group by day, then limit to 50 per day
    const imagesByDay = {};
    
    imageEntries.forEach(([timestamp, url]) => {
      try {
        const fermentationInfo = calculateFermentationDay(timestamp);
        const { dayKey, stageName, dayNumber } = fermentationInfo;
        
        // Only include Day 0-6
        if (dayNumber <= 6) {
          if (!imagesByDay[dayKey]) {
            imagesByDay[dayKey] = [];
          }
          imagesByDay[dayKey].push({ timestamp, url, dayNumber, stageName });
        }
      } catch (error) {
        logProductionError(error, `imageExportUtils.ProcessImage.${timestamp}`);
        // Skip problematic images but continue processing
      }
    });
    
    // Sort each day by timestamp and limit to 50 images per day
    const limitedImages = [];
    try {
      Object.keys(imagesByDay).forEach(day => {
        const dayImages = imagesByDay[day].sort((a, b) => {
          const timeA = safeParseTimestamp(a.timestamp);
          const timeB = safeParseTimestamp(b.timestamp);
          if (!timeA && !timeB) return 0;
          if (!timeA) return 1;
          if (!timeB) return -1;
          return timeA.getTime() - timeB.getTime();
        });
        limitedImages.push(...dayImages.slice(0, 50)); // 50 images per day
      });
    } catch (error) {
      logProductionError(error, 'imageExportUtils.SortImages');
      Alert.alert("Processing Error", "Failed to sort images. Using unsorted data.");
      // Fallback: use unsorted images
      Object.values(imagesByDay).forEach(dayImages => {
        limitedImages.push(...dayImages.slice(0, 50));
      });
    }

    // Process images with day and stage information
    const imagesWithInfo = limitedImages.map(({ timestamp, url, dayNumber, stageName }) => {
      const parsedDate = safeParseTimestamp(timestamp);
      
      return {
        timestamp,
        url,
        dayNumber,
        stageName,
        parsedDate
      };
    }).sort((a, b) => {
      const timeA = a.parsedDate?.getTime() || 0;
      const timeB = b.parsedDate?.getTime() || 0;
      return timeA - timeB;
    });

    const htmlStart = Date.now();

    // Validate images before processing
    if (imagesWithInfo.length === 0) {
      Alert.alert("No Images", "No images found to export after processing.");
      return;
    }

    // Use all processed images (already limited to 50 per day)
    const pdfImages = imagesWithInfo;

    // Very simple HTML generation - 2 images per row
    const imagesHtml = [];
    for (let i = 0; i < pdfImages.length; i += 2) {
      try {
        const rowImages = pdfImages.slice(i, i + 2);
        
        const rowHtml = `<div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
          ${rowImages.map((img) => 
            `<div style="width: 45%; text-align: center;">
              <img src="${img.url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 5px; margin-bottom: 5px;" />
              <div style="padding: 5px; background: #f5e9dd; border-radius: 5px; font-size: 10px;">
                <strong>Day ${img.dayNumber}</strong><br>
                <span style="color: #666; font-size: 9px;">${img.stageName}</span>
              </div>
            </div>`
          ).join('')}
        </div>`;
        
        imagesHtml.push(rowHtml);
      } catch (error) {
        logProductionError(error, `imageExportUtils.HTMLGeneration.${i}`);
        // Continue processing other rows even if one fails
      }
    }

    // Very simple HTML structure
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; padding: 20px; color: #333; background: #fff8f0; }
h1 { color: #5b3a29; text-align: center; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>📸 CacaoTrack Images</h1>
<p><strong>Total Images:</strong> ${pdfImages.length}</p>
${imagesHtml.join('')}
</body>
</html>`;

    const htmlTime = Date.now() - htmlStart;

    const pdfStart = Date.now();
    
    let file;
    try {
      file = await Print.printToFileAsync({ 
        html,
        base64: false,
        width: 612,
        height: 792
      });
    } catch (printError) {
      logProductionError(printError, 'imageExportUtils.PDFGeneration');
      Alert.alert("PDF Error", "Failed to generate PDF. Please try again.");
      return;
    }
    
    const pdfTime = Date.now() - pdfStart;
    
    const totalTime = Date.now() - startTime;
    
    try {
      await Sharing.shareAsync(file.uri, {
        dialogTitle: "Share Images PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (shareError) {
      logProductionError(shareError, 'imageExportUtils.Sharing');
      Alert.alert("Share Error", "PDF created but failed to share. Check your downloads folder.");
      // Don't return here - PDF was created successfully
    }
    
    Alert.alert("Success", `PDF with ${pdfImages.length} images created in ${(totalTime/1000).toFixed(1)}s.`);
  } catch (error) {
    logProductionError(error, 'imageExportUtils.General');
    Alert.alert("Export Error", error.message || "Unable to export images PDF.");
  } finally {
    isExporting = false;
  }
}
