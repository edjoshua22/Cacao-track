import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get, getDatabase } from 'firebase/database';
import { app } from '../firebaseConfig.secure';
import { useNavigation } from '@react-navigation/native';
import LineChart from '../components/LineChart';
import Background from '../components/Background';
import { useAppTheme } from '../context/ThemeContext';
import { initializeAuth, getUserId } from '../utils/authUtils';

// Lazy getter — safe even if app isn't initialized at module parse time
const getDb = () => getDatabase(app);
const DAY_MS = 24 * 60 * 60 * 1000;

const STAGES = [
  { name: 'Fresh',                color: '#8B5A2B', icon: 'leaf-outline' },
  { name: 'Anaerobic',            color: '#7C3AED', icon: 'flask-outline' },
  { name: 'Anaerobic / Alcoholic',color: '#3B82F6', icon: 'beaker-outline' },
  { name: 'Aerobic',              color: '#10B981', icon: 'sunny-outline' },
  { name: 'Aerobic',              color: '#10B981', icon: 'sunny-outline' },
  { name: 'Maturation',           color: '#F59E0B', icon: 'time-outline' },
  { name: 'Drying Ready',         color: '#EF4444', icon: 'checkmark-circle-outline' },
];

// ── helpers ──────────────────────────────────────────────────────────
function buildDayBuckets(batchData) {
  const days = STAGES.map((s) => ({ stageName: s.name, sensorData: [] }));
  if (!batchData.sensorData) return days;

  const startTime = parseInt(batchData.createdAt || batchData.startTime || Date.now());
  const entries = Array.isArray(batchData.sensorData)
    ? batchData.sensorData
    : Object.values(batchData.sensorData);

  entries.forEach((entry) => {
    if (!entry || !entry.time) return;
    let t = entry.timestamp;
    if (!t) {
      const p = new Date(entry.time.replace(/-/g, '/')).getTime();
      t = isNaN(p) ? startTime : p;
    }
    let idx = Math.floor((t - startTime) / DAY_MS);
    if (idx < 0) idx = 0;
    if (idx > 6) idx = 6;
    days[idx].sensorData.push(entry);
  });

  days.forEach((day) =>
    day.sensorData.sort((a, b) => {
      const ta = a.timestamp || new Date(a.time.replace(/-/g, '/')).getTime();
      const tb = b.timestamp || new Date(b.time.replace(/-/g, '/')).getTime();
      return ta - tb;
    })
  );
  return days;
}

// ── sub-components ────────────────────────────────────────────────────
const DayCard = React.memo(({ dayIndex, dayData, colors, isDark }) => {
  const stage = STAGES[dayIndex];
  const hasData = dayData?.sensorData?.length > 0;
  const [expanded, setExpanded] = useState(true);
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const labels = [], tempDHT1 = [], tempDHT2 = [], humidDHT1 = [], humidDHT2 = [], moist = [];
  if (hasData) {
    dayData.sensorData.forEach((e) => {
      labels.push(e.time ? String(e.time).split(' ')[1] || String(e.time) : '');
      tempDHT1.push(Number(e.tempDHT1 ?? e.temperature ?? 0));
      tempDHT2.push(Number(e.tempDHT2 ?? e.temperature ?? 0));
      humidDHT1.push(Number(e.humidDHT1 ?? e.humidity ?? 0));
      humidDHT2.push(Number(e.humidDHT2 ?? e.humidity ?? 0));
      moist.push(Number(e.soilMoisture ?? 0));
    });
  }

  return (
    <View style={[styles.dayCard, { backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF', borderColor: stage.color + '40' }]}>
      {/* Collapsible header */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.dayCardHeader}>
        <LinearGradient
          colors={[stage.color + '28', stage.color + '08']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.dayCardHeaderGradient}
        >
          <View style={[styles.dayBadge, { backgroundColor: stage.color }]}>
            <Text style={styles.dayBadgeText}>{dayIndex}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dayCardTitle, { color: colors.text }]}>{dayData?.stageName || stage.name}</Text>
            <View style={styles.dayCardMeta}>
              <Ionicons name={stage.icon} size={12} color={stage.color} />
              <Text style={[styles.dayCardSub, { color: colors.subtext }]}>
                {hasData ? `${dayData.sensorData.length} readings` : 'No data recorded'}
              </Text>
              {hasData && (
                <View style={[styles.dataChip, { backgroundColor: stage.color + '20' }]}>
                  <Text style={[styles.dataChipText, { color: stage.color }]}>Has Data</Text>
                </View>
              )}
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={20} color={stage.color} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        hasData ? (
          <View style={styles.chartWrapper}>
            <LineChart
              labels={labels}
              tempDHT1Data={tempDHT1}
              tempDHT2Data={tempDHT2}
              humidDHT1Data={humidDHT1}
              humidDHT2Data={humidDHT2}
              moistureData={moist}
              hideHeader={true}
            />
          </View>
        ) : (
          <View style={styles.noData}>
            <Ionicons name="stats-chart-outline" size={36} color={colors.subtext} />
            <Text style={[styles.noDataText, { color: colors.subtext }]}>No sensor data recorded for this stage</Text>
          </View>
        )
      )}
    </View>
  );
});

// ── Batch Selector Pill ───────────────────────────────────────────────
const BatchPill = React.memo(({ batch, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.pill,
      isSelected && styles.pillActive,
    ]}
  >
    {isSelected && (
      <LinearGradient
        colors={['#8B5A2B', '#A0522D']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <Ionicons
      name={isSelected ? 'leaf' : 'leaf-outline'}
      size={14}
      color={isSelected ? '#fff' : '#8B5A2B'}
      style={{ marginRight: 6 }}
    />
    <View>
      <Text style={[styles.pillName, { color: isSelected ? '#fff' : '#5B3A29' }]} numberOfLines={1}>
        {batch.name || 'Unnamed'}
      </Text>
      <Text style={[styles.pillDate, { color: isSelected ? 'rgba(255,255,255,0.7)' : '#8B7355' }]}>
        {batch.createdAt ? new Date(parseInt(batch.createdAt)).toLocaleDateString() : '—'}
      </Text>
    </View>
  </TouchableOpacity>
));

// ── Main Screen ───────────────────────────────────────────────────────
export default function FermentationHistoryScreen() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();

  const [batches, setBatches] = useState([]);       // [{id, name, createdAt, raw}]
  const [selectedId, setSelectedId] = useState(null);
  const [days, setDays] = useState(null);            // null=loading, []=no data
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingDays, setLoadingDays] = useState(false);

  // Fetch all user batches once on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        if (!userId) { setLoadingBatches(false); return; }

        const snap = await get(ref(getDb(), 'batches/' + userId));
        if (cancelled) return;

        if (!snap.exists()) { setBatches([]); setLoadingBatches(false); return; }

        const data = snap.val();
        const list = Object.entries(data)
          .map(([id, b]) => ({ id, name: b.name, createdAt: b.createdAt, raw: b }))
          .sort((a, b) => parseInt(b.createdAt || 0) - parseInt(a.createdAt || 0));

        setBatches(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setDays(buildDayBuckets(list[0].raw));
        }
      } catch (e) {
        console.warn('FermentationHistoryScreen: batch load error', e);
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const selectBatch = useCallback((batch) => {
    if (batch.id === selectedId) return;
    setSelectedId(batch.id);
    setLoadingDays(true);
    // Process synchronously since raw data is already in memory
    setTimeout(() => {
      setDays(buildDayBuckets(batch.raw));
      setLoadingDays(false);
    }, 150); // tiny delay for visual feedback
  }, [selectedId]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <Background variant="gradient">
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Fermentation History</Text>
            <Text style={styles.headerSubtitle}>Day 0 – 6 · Stage Analysis</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="analytics" size={20} color="#fff" />
          </View>
        </View>

        {loadingBatches ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading batches…</Text>
          </View>
        ) : batches.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="cube-outline" size={64} color={colors.subtext} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Batches Found</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Create a batch in the Batch tab to see fermentation history.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Batch Selector ── */}
            <View style={styles.selectorSection}>
              <View style={styles.selectorHeader}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={[styles.selectorLabel, { color: colors.text }]}>Select Batch</Text>
                <Text style={[styles.selectorCount, { color: colors.subtext }]}>{batches.length} batch{batches.length !== 1 ? 'es' : ''}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {batches.map((b) => (
                  <BatchPill
                    key={b.id}
                    batch={b}
                    isSelected={b.id === selectedId}
                    onPress={() => selectBatch(b)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* ── Selected Batch Info ── */}
            {selectedId && (() => {
              const sel = batches.find(b => b.id === selectedId);
              return sel ? (
                <LinearGradient
                  colors={isDark ? ['#2A1F14', '#1A1200'] : ['#FFF8F0', '#FFF3E0']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.batchInfoCard, { borderColor: '#8B5A2B40' }]}
                >
                  <View style={styles.batchInfoRow}>
                    <View style={[styles.batchInfoIcon, { backgroundColor: '#8B5A2B20' }]}>
                      <Ionicons name="leaf" size={22} color="#8B5A2B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.batchInfoName, { color: colors.text }]}>{sel.name}</Text>
                      <Text style={[styles.batchInfoDate, { color: colors.subtext }]}>
                        Started {sel.createdAt ? new Date(parseInt(sel.createdAt)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                      </Text>
                    </View>
                    <View style={[styles.stageCountBadge, { backgroundColor: '#8B5A2B' }]}>
                      <Text style={styles.stageCountText}>7 stages</Text>
                    </View>
                  </View>
                </LinearGradient>
              ) : null;
            })()}

            {/* ── Day 0–6 Cards ── */}
            <View style={styles.daysSection}>
              <View style={styles.daysSectionHeader}>
                <View style={[styles.daysSectionDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.daysSectionTitle, { color: colors.text }]}>Stage Breakdown</Text>
              </View>

              {loadingDays ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.subtext }]}>Building charts…</Text>
                </View>
              ) : days && days.map((day, i) => (
                <DayCard
                  key={i}
                  dayIndex={i}
                  dayData={day}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Background>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1 },
  headerTitleText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Batch selector
  selectorSection: { marginBottom: 20 },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectorLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  selectorCount: { fontSize: 12 },
  pillRow: { gap: 10, paddingRight: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#8B5A2B50',
    backgroundColor: 'rgba(139,90,43,0.06)',
    overflow: 'hidden',
    minWidth: 120,
  },
  pillActive: {
    borderColor: '#8B5A2B',
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pillName: { fontSize: 13, fontWeight: '700' },
  pillDate: { fontSize: 10, marginTop: 1 },

  // Batch info card
  batchInfoCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  batchInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  batchInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchInfoName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  batchInfoDate: { fontSize: 12, marginTop: 3 },
  stageCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stageCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Days section
  daysSection: {},
  daysSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  daysSectionDot: { width: 10, height: 10, borderRadius: 5 },
  daysSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Day card
  dayCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dayCardHeader: { overflow: 'hidden' },
  dayCardHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  dayBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  dayCardTitle: { fontSize: 14, fontWeight: '800' },
  dayCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dayCardSub: { fontSize: 11 },
  dataChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dataChipText: { fontSize: 10, fontWeight: '700' },
  chartWrapper: { padding: 8 },
  noData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  noDataText: { fontSize: 13, fontWeight: '500' },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
