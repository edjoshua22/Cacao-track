import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';
import { initializeAuth, getUserId } from '../utils/authUtils';
import Card from '../components/Card';
import { useAppTheme } from '../context/ThemeContext';
import { calculateFermentationDay } from '../utils/fermentationUtils';

export default function TimelineScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasDryingAlert, setHasDryingAlert] = useState(false);

  // Memoize timestamp parser to avoid recreating on every render
  const parseTimestamp = useCallback((ts) => {
    try {
      const [d, t] = ts.includes('_') ? ts.split('_') : ts.split(' ');
      const [y, m, day] = d.split('-').map(Number);
      const [h, min, s] = t.split(/[-:]/).map(Number);
      return new Date(y, m - 1, day, h, min, s);
    } catch {
      return null;
    }
  }, []);

  // Memoize image processing to avoid reprocessing on every render
  const processedImages = useMemo(() => {
    if (!images.length) return [];
    
    return images.map(img => {
      const date = parseTimestamp(img.timestamp);
      const stageName = img.inference?.stage || 'Unknown';
      const dayKey = img.inference?.day || 'day0';
      const dayNumber = dayKey.replace('day', '') || '0';
      return {
        ...img,
        parsedDate: date,
        dayNumber,
        displayDate: date ? date.toLocaleString() : img.timestamp
      };
    });
  }, [images, parseTimestamp]);

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const capturesRef = ref(db, `captures/${userId}`);
        
        // Also check if images are stored directly under 'captures' (without userId)
        const globalCapturesRef = ref(db, 'captures');
        
        // Try user-specific path first
        unsubscribe = onValue(capturesRef, async (snapshot) => {
          setRefreshing(false);

          if (snapshot.exists()) {
            const data = snapshot.val();
            
            if (data != null) {
              // Process images without AI inference for speed
              const results = Object.entries(data).map(([timestamp, url]) => {
                return { timestamp, url };
              });

              // Sort by timestamp (newest first)
              results.sort((a, b) => {
                const da = parseTimestamp(a.timestamp);
                const db = parseTimestamp(b.timestamp);
                return db - da;
              });

              // Process results and assign to days using dynamic calculation
              const processedResults = results.map((result) => {
                const fermentationInfo = calculateFermentationDay(result.timestamp);
                
                return {
                  ...result,
                  inference: {
                    day: fermentationInfo.dayKey,
                    stage: fermentationInfo.stageName
                  }
                };
              });

              // Sort newest first for display
              processedResults.sort((a, b) => {
                const da = parseTimestamp(a.timestamp);
                const db = parseTimestamp(b.timestamp);
                return db - da;
              });

              setImages(processedResults);
              setHasDryingAlert(false);
            }
          } else {
            // If no user-specific data, check global captures
            const globalUnsubscribe = onValue(globalCapturesRef, (globalSnapshot) => {
              
              if (globalSnapshot.exists()) {
                const globalData = globalSnapshot.val();
                
                if (globalData != null) {
                  const results = Object.entries(globalData).map(([timestamp, url]) => {
                    return { timestamp, url };
                  });

                  // Sort by timestamp (newest first)
                  results.sort((a, b) => {
                    const da = parseTimestamp(a.timestamp);
                    const db = parseTimestamp(b.timestamp);
                    return da - db;
                  });

                  const processedResults = results.map((result) => {
                    const fermentationInfo = calculateFermentationDay(result.timestamp);
                    
                    return {
                      ...result,
                      inference: {
                        day: fermentationInfo.dayKey,
                        stage: fermentationInfo.stageName
                      }
                    };
                  });

                  processedResults.sort((a, b) => {
                    const da = parseTimestamp(a.timestamp);
                    const db = parseTimestamp(b.timestamp);
                    return db - da;
                  });

                  setImages(processedResults);
                  setHasDryingAlert(false);
                }
              }
            });
          }
          // Don't clear images if snapshot doesn't exist - keep existing data
          setLoading(false);
        });
      } catch (error) {
        console.error('TimelineScreen: Failed to setup listener:', error);
        setLoading(false);
      }
    };
    
    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Memoized RenderItem to prevent unnecessary re-renders of individual tiles
  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() =>
        navigation.navigate('ImageDetail', {
          ...item,
          parsedDateTimestamp: item.parsedDate ? item.parsedDate.getTime() : null,
          parsedDate: undefined
        })
      }
    >
      <Image source={{ uri: item.url }} style={styles.image} />
      <Text style={[styles.caption, { color: colors.subtext }]}>
        Day {item.dayNumber} - {item.inference?.stage || 'Unknown'}
      </Text>
      <Text style={styles.timestamp}>
        {item.displayDate}
      </Text>
    </TouchableOpacity>
  ), [navigation, colors.subtext]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>
          Loading images...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={processedImages}
        renderItem={renderItem}
        keyExtractor={(item) => item.timestamp}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text style={[styles.title, { color: colors.text }]}>
            Cacao Bean Timeline
          </Text>
        }
        ListEmptyComponent={
          <Card>
            <Text style={{ textAlign: 'center', color: colors.subtext }}>
              No images yet
            </Text>
          </Card>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  tile: { width: '48%', marginBottom: 16 },
  image: { width: '100%', height: 120, borderRadius: 12 },
  caption: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  timestamp: { fontSize: 10, opacity: 0.6 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  columnWrapper: { justifyContent: 'space-between' },
});
