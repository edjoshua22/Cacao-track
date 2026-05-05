/**
 * ImageDetail.js
 * Shows a full-screen detail view for a single timeline capture image.
 * Cleaned up: extracted sub-components, shared styles, named export.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useAppTheme }            from '../../context/ThemeContext';
import { detailStyles as styles } from './DetailStyles';

// ── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES = {
  day0: 'Fresh',
  day1: 'Anaerobic',
  day2: 'Anaerobic / Alcoholic',
  day3: 'Aerobic',
  day4: 'Aerobic',
  day5: 'Maturation',
  day6: 'Drying Ready',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a timestamp string "YYYY-MM-DD_HH-MM-SS" (or with colons) into a Date.
 * @param {string} ts
 * @returns {Date|null}
 */
const parseTimestamp = (ts) => {
  try {
    const [datePart, timePart] = ts.includes('_') ? ts.split('_') : ts.split(' ');
    const [year, month, day]   = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(/[-:]/).map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  } catch {
    return null;
  }
};

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * ImageViewer — shows the image with loading and error states.
 */
const ImageViewer = React.memo(({ url, colors }) => {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const onLoadStart = useCallback(() => setLoading(true),  []);
  const onLoadEnd   = useCallback(() => setLoading(false), []);
  const onError     = useCallback(() => { setLoading(false); setError(true); }, []);

  return (
    <View style={[styles.imageContainer, { backgroundColor: colors?.placeholderBg || '#E5E7EB' }]}>
      {loading && !error && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors?.overlayBg || 'rgba(0,0,0,0.5)' }]}>
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
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onError={onError}
          resizeMode="contain"
        />
      )}
    </View>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

/**
 * ImageDetail — full detail view for a single cacao timeline image.
 * Receives route params: url, day, stage, confidence, timestamp.
 */
const ImageDetail = ({ route }) => {
  const { colors }                              = useAppTheme();
  const { url, day, stage, confidence, timestamp } = route.params;

  const parsedDate       = parseTimestamp(timestamp);
  const displayTimestamp = parsedDate ? parsedDate.toLocaleString() : timestamp;
  const dayNumber        = day ? day.replace('day', '') : '';
  const stageName        = DAY_NAMES[day] || stage || 'Unknown';
  const confidencePct    = confidence ? Math.round(confidence * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors?.bg }]}>
      <Text style={[styles.imageTitle, { color: colors?.text }]}>Image Detail</Text>

      <ImageViewer url={url} colors={colors} />

      <Text style={[styles.caption,   { color: colors?.text }]}>
        Day {dayNumber} — {stageName} ({confidencePct}%)
      </Text>
      <Text style={[styles.timestamp, { color: colors?.subtext }]}>
        Captured: {displayTimestamp}
      </Text>
    </View>
  );
};

export default ImageDetail;
