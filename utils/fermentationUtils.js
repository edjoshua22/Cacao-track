// utils/fermentationUtils.js
// Shared utilities for fermentation stage calculations

// Safe timestamp parsing with multiple format support
export const safeParseTimestamp = (timestampStr) => {
  if (!timestampStr || typeof timestampStr !== 'string') {
    return null;
  }

  try {
    let datePart, timePart;
    
    if (timestampStr.includes('_')) {
      [datePart, timePart] = timestampStr.split("_");
      
      if (timestampStr.includes('-')) {
        // Format: YYYY-MM-DD_HH-MM-SS
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
        
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            isNaN(hour) || isNaN(minute) || isNaN(second)) {
          return null;
        }
        
        return new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Format: YYYYMMDD_HHMMSS
        if (datePart.length !== 8 || timePart.length !== 6) {
          return null;
        }
        
        const year = parseInt(datePart.substring(0, 4));
        const month = parseInt(datePart.substring(4, 6));
        const day = parseInt(datePart.substring(6, 8));
        const hour = parseInt(timePart.substring(0, 2));
        const minute = parseInt(timePart.substring(2, 4));
        const second = parseInt(timePart.substring(4, 6));
        
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            isNaN(hour) || isNaN(minute) || isNaN(second)) {
          return null;
        }
        
        return new Date(year, month - 1, day, hour, minute, second);
      }
    } else {
      // Try direct Date parsing
      const date = new Date(timestampStr);
      return isNaN(date.getTime()) ? null : date;
    }
  } catch (error) {
    return null;
  }
};

// Calculate fermentation day based on elapsed time
export const calculateFermentationDay = (timestamp, batchStartTime = null) => {
  const imageTime = safeParseTimestamp(timestamp);
  if (!imageTime) {
    return { dayKey: 'day0', stageName: 'Unknown', dayNumber: 0 };
  }

  const now = Date.now();
  const referenceTime = batchStartTime || imageTime;
  const elapsedMs = now - referenceTime;
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

  // Dynamic day calculation based on actual fermentation timeline
  if (elapsedDays >= 6) {
    return { dayKey: 'day6', stageName: 'Drying Ready', dayNumber: 6 };
  } else if (elapsedDays >= 5) {
    return { dayKey: 'day5', stageName: 'Maturation', dayNumber: 5 };
  } else if (elapsedDays >= 3) {
    return { dayKey: 'day3', stageName: 'Aerobic', dayNumber: 3 };
  } else if (elapsedDays >= 2) {
    return { dayKey: 'day2', stageName: 'Anaerobic / Alcoholic', dayNumber: 2 };
  } else if (elapsedDays >= 1) {
    return { dayKey: 'day1', stageName: 'Anaerobic', dayNumber: 1 };
  } else {
    return { dayKey: 'day0', stageName: 'Fresh', dayNumber: 0 };
  }
};

// Safe sorting function for timestamps
export const safeSortByTimestamp = (a, b, ascending = true) => {
  const timeA = safeParseTimestamp(a.timestamp || a);
  const timeB = safeParseTimestamp(b.timestamp || b);
  
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  
  return ascending ? timeA.getTime() - timeB.getTime() : timeB.getTime() - timeA.getTime();
};

// Batch quality calculation
export const calculateBatchQuality = (avgTemp, avgHumidity, dataPoints) => {
  if (!dataPoints || dataPoints === 0) {
    return "Needs Attention";
  }
  
  const tempInRange = avgTemp >= 45 && avgTemp <= 50;
  const humidityInRange = avgHumidity >= 60 && avgHumidity <= 80;
  
  if (tempInRange && humidityInRange) {
    return "Good";
  } else if (tempInRange || humidityInRange) {
    return "Fair";
  } else {
    return "Needs Attention";
  }
};

// Batch status calculation
export const calculateBatchStatus = (completedAt, createdAt, dataPoints) => {
  if (completedAt) {
    return "Finished";
  } else if (dataPoints > 0) {
    return "Ongoing";
  } else {
    return "Just Started";
  }
};
