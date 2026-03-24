import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext'; // Adjust if needed

// Map day keys to human-readable stage names
const DAY_NAMES = {
  day0: "Fresh",
  day1: "Anaerobic",
  day2: "Anaerobic / Alcoholic",
  day3: "Aerobic",
  day4: "Aerobic",
  day5: "Maturation",
  day6: "Drying Ready",
};

// Robust timestamp parser
const parseTimestamp = (timestampStr) => {
  try {
    const [datePart, timePart] = timestampStr.includes('_') ? timestampStr.split('_') : timestampStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  } catch (error) {
    // Error parsing timestamp
    return null;
  }
};

export default function ImageDetail({ route }) {
  const { colors } = useAppTheme();
  const { url, day, stage, confidence, timestamp } = route.params; // Updated keys to match TimelineScreen
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const parsedDate = parseTimestamp(timestamp);
  const displayTimestamp = parsedDate ? parsedDate.toLocaleString() : timestamp;
  
  // Extract day number from day key (e.g., "day0" -> "0")
  const dayNumber = day ? day.replace('day', '') : '';
  const stageName = DAY_NAMES[day] || stage || 'Unknown';
  const confidencePct = confidence ? Math.round(confidence * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors?.bg }]}>
      <Text style={[styles.title, { color: colors?.text }]}>Image Detail</Text>
      
      <View style={[styles.imageContainer, { backgroundColor: colors?.placeholderBg || '#E5E7EB' }]}>
        {loading && !error && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors?.overlayBg || 'rgba(0, 0, 0, 0.5)' }]}>
            <ActivityIndicator size="large" color={colors?.primary} />
          </View>
        )}
        {error ? (
          <View style={styles.errorOverlay}>
            <Text style={[styles.errorText, { color: colors?.text }]}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: url }}
            style={styles.image}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            resizeMode="contain"
          />
        )}
      </View>

      <Text style={[styles.caption, { color: colors?.text }]}>
        Day {dayNumber} - {stageName} ({confidencePct}%)
      </Text>
      <Text style={[styles.timestamp, { color: colors?.subtext }]}>
        Timestamp: {displayTimestamp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  imageContainer: {
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 16, marginBottom: 8 },
  timestamp: { fontSize: 14, opacity: 0.7 },
});
