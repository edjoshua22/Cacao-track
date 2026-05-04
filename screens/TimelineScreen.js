/**
 * TimelineScreen.js
 * Grid of all cacao capture images, sorted newest first.
 * Refactored: ImageTile extracted, parseTimestamp extracted, no duplicate sort logic, named export.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, FlatList,
  RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ref, onValue }  from 'firebase/database';
import { db }            from '../firebaseConfig.secure';
import Card              from '../components/Card';
import { useAppTheme }   from '../context/ThemeContext';
import { initializeAuth, getUserId } from '../utils/authUtils';
import { calculateFermentationDay }  from '../utils/fermentationUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a timestamp string "YYYY-MM-DD_HH-MM-SS" into a Date (or null).
 * Module-level so it's not recreated each render.
 * @param {string} ts
 * @returns {Date|null}
 */
const parseTimestamp = (ts) => {
  try {
    const [d, t] = ts.includes('_') ? ts.split('_') : ts.split(' ');
    const [y, m, day] = d.split('-').map(Number);
    const [h, min, s] = t.split(/[-:]/).map(Number);
    return new Date(y, m - 1, day, h, min, s);
  } catch {
    return null;
  }
};

/**
 * Build processed image array from a raw captures object.
 * @param {object} data - Firebase captures value
 * @returns {object[]} sorted newest-first
 */
const buildImageList = (data) => {
  const results = Object.entries(data).map(([timestamp, url]) => {
    const fermentationInfo = calculateFermentationDay(timestamp);
    const parsedDate       = parseTimestamp(timestamp);
    return {
      timestamp,
      url,
      inference:   { day: fermentationInfo.dayKey, stage: fermentationInfo.stageName },
      parsedDate,
      dayNumber:   fermentationInfo.dayKey.replace('day', '') || '0',
      displayDate: parsedDate ? parsedDate.toLocaleString() : timestamp,
    };
  });
  return results.sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0));
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single image tile in the 2-column grid. */
const ImageTile = React.memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={() => onPress(item)}>
    <Image source={{ uri: item.url }} style={styles.image} />
    <Text style={styles.caption}>Day {item.dayNumber} — {item.inference?.stage || 'Unknown'}</Text>
    <Text style={styles.timestamp}>{item.displayDate}</Text>
  </TouchableOpacity>
));

const ListHeader = React.memo(({ color }) => (
  <Text style={[styles.title, { color }]}>Cacao Bean Timeline</Text>
));

const EmptyState = React.memo(({ color }) => (
  <Card>
    <Text style={{ textAlign: 'center', color }}>No images yet</Text>
  </Card>
));

// ── Main screen ───────────────────────────────────────────────────────────────

/**
 * TimelineScreen — 2-column image grid of all cacao capture photos.
 */
const TimelineScreen = () => {
  const { colors }                          = useAppTheme();
  const navigation                          = useNavigation();
  const [images,     setImages]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeGlobal = null;

    const setup = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        if (!userId) throw new Error('Not authenticated');

        const userRef   = ref(db, `captures/${userId}`);
        const globalRef = ref(db, 'captures');

        unsubscribeUser = onValue(userRef, (snap) => {
          setRefreshing(false);
          setLoading(false);

          if (snap.exists() && snap.val() != null) {
            setImages(buildImageList(snap.val()));
          } else {
            // Fall back to global captures
            unsubscribeGlobal = onValue(globalRef, (gSnap) => {
              if (gSnap.exists() && gSnap.val() != null) {
                setImages(buildImageList(gSnap.val()));
              }
            });
          }
        });
      } catch (e) {
        console.error('TimelineScreen setup error:', e);
        setLoading(false);
      }
    };

    setup();
    return () => {
      if (unsubscribeUser)   unsubscribeUser();
      if (unsubscribeGlobal) unsubscribeGlobal();
    };
  }, []);

  const handleImagePress = useCallback((item) => {
    navigation.navigate('ImageDetail', {
      ...item,
      parsedDateTimestamp: item.parsedDate ? item.parsedDate.getTime() : null,
      parsedDate: undefined,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ImageTile item={item} onPress={handleImagePress} />
  ), [handleImagePress]);

  const keyExtractor = useCallback((item) => item.timestamp, []);
  const onRefresh    = useCallback(() => setRefreshing(true), []);

  const listHeader   = useMemo(() => <ListHeader color={colors.text} />,    [colors.text]);
  const emptyState   = useMemo(() => <EmptyState color={colors.subtext} />, [colors.subtext]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>Loading images...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
};

export default TimelineScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  title:         { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  tile:          { width: '48%', marginBottom: 16 },
  image:         { width: '100%', height: 120, borderRadius: 12 },
  caption:       { fontSize: 12, fontWeight: '600', marginTop: 6, color: '#666' },
  timestamp:     { fontSize: 10, opacity: 0.6 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  columnWrapper: { justifyContent: 'space-between' },
  listContent:   { padding: 16 },
});
