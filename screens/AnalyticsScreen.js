import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, FlatList, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import Background from "../components/Background";

// ── Dependency Injection ──────────────────────────────────────────────────────
import container from '../src/core/di/container';

// ── Data & Logic ──────────────────────────────────────────────────────────────
import { useBatchList } from '../src/features/batch/presentation/hooks/useBatchList';
import { createBatch } from './Menu/batchUtils';
import { ChartSeriesFactory } from '../src/features/analytics/factories/ChartSeriesFactory';

// ── Components ────────────────────────────────────────────────────────────────
import { SectionHeader as SH, DayCard } from '../src/features/analytics/presentation/components/AnalyticsComponents';
import { HeroCard } from '../src/features/analytics/presentation/components/HeroCard';
import { OverviewChartCard } from '../src/features/analytics/presentation/components/OverviewChartCard';

export default function AnalyticsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();

  const { batches, isLoading, error, deleteBatch } = useBatchList();

  // Batch 1 is a fixed historical window. Anything after this belongs to Batch 2+.
  const BATCH1_END_STR = '2026-01-14 22:32:21';
  const BATCH1_END_MS = useMemo(() => new Date(2026, 0, 14, 22, 32, 21).getTime(), []);

  // Always default to 'batch-0' so the user sees all historical readings first
  const [selectedBatchId, setSelectedBatchId] = useState('batch-0');
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const parseEntryTimeMs = useCallback((entry) => {
    if (!entry) return 0;
    if (typeof entry.timestamp === 'number' && isFinite(entry.timestamp)) return entry.timestamp;
    const raw = entry.time ? String(entry.time).replace(/_/g, ' ').trim() : '';
    if (!raw) return 0;

    // Support:
    // - "YYYY-MM-DD HH:mm:ss"
    // - "YYYY-MM-DD HH-mm-ss"
    // - "YYYY-MM-DD_HH-mm-ss"
    // - "YYYY/MM/DD HH:mm:ss" (legacy)
    const [d, t] = raw.includes(' ') ? raw.split(' ') : [raw, ''];
    const datePart = d.replace(/\//g, '-');
    const [y, m, day] = datePart.split('-').map(Number);
    if (!y || !m || !day) return 0;
    if (!t) return new Date(y, m - 1, day).getTime();
    const [hh, mm, ss] = t.split(/[-:]/).map(Number);
    return new Date(y, m - 1, day, hh || 0, mm || 0, ss || 0).getTime();
  }, []);

  // Global Data State
  const [globalLoading, setGlobalLoading] = useState(true);
  const [allSensorEntries, setAllSensorEntries] = useState([]);
  const [globalViewData, setGlobalViewData] = useState({
    overviewSeries: null, dayGroups: [], stats: null, latest: null, totalReadings: 0, totalImages: 0,
  });
  const [globalCaptures, setGlobalCaptures] = useState([]);

  // Subscribe to global data (Batch 0)
  useEffect(() => {
    const useCase = container.resolve('getAnalyticsDataUseCase');
    const unsub = useCase.execute(
      (data) => {
        const allEntries = (data?.rawEntries || []).filter(e => e?.time);
        setAllSensorEntries(allEntries);

        // Force Batch 1 (global view) to end at a fixed cutoff so new readings move to Batch 2+.
        const entries = allEntries.filter(e => String(e.time) <= BATCH1_END_STR);

        if (!entries.length) {
          setGlobalViewData({
            overviewSeries: null,
            dayGroups: [],
            stats: null,
            latest: null,
            totalReadings: 0,
            totalImages: 0,
          });
          setGlobalLoading(false);
          return;
        }

        const overviewSeries = ChartSeriesFactory.overview(entries);
        const stats = ChartSeriesFactory.stats(entries);
        const dayMap = ChartSeriesFactory.groupByDate(entries);
        const dayGroups = Array.from(dayMap.entries()).map(([dateStr, dayEntries]) => {
          return {
            dateStr,
            entries: dayEntries,
            series: ChartSeriesFactory.forDay(dayEntries),
            stats: ChartSeriesFactory.stats(dayEntries),
          };
        });
        const latest = entries[entries.length - 1];

        setGlobalViewData({
          overviewSeries,
          dayGroups,
          stats,
          latest,
          totalReadings: entries.length,
          totalImages: 0,
        });
        setGlobalLoading(false);
      },
      (err) => {
        console.warn("[AnalyticsScreen] DI UseCase error:", err);
        setGlobalLoading(false);
      }
    );
    const timelineUseCase = container.resolve('getTimelineUseCase');
    let unsubTimeline = null;
    timelineUseCase.execute({
      callback: (captures) => {
        setGlobalCaptures(captures || []);
      }
    }).then(res => {
      if (res.success && res.data?.unsubscribe) unsubTimeline = res.data.unsubscribe;
    });

    return () => {
      unsub();
      if (unsubTimeline) unsubTimeline();
    };
  }, []);

  const selectedBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const handleAddBatch = useCallback(async () => {
    setIsCreating(true);
    try {
      // Since Batch 1 is the permanent global view, real batches start at Batch 2
      const newName = `Batch ${batches.length + 2}`;
      
      const createdBatch = await createBatch(
        newName,
        "Auto-created from Analytics",
        Date.now()
      );
      // Select by id if returned, otherwise keep previous behavior (some versions return data only)
      const createdBatchId = createdBatch?.id || createdBatch;
      setSelectedBatchId(createdBatchId);
      setModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Could not create batch.");
    } finally {
      setIsCreating(false);
    }
  }, [batches.length, BATCH1_END_MS]);

  const batchViewData = useMemo(() => {
    if (!selectedBatch) return { dayGroups: [], totalReadings: 0, stats: null };

    // Create base 7-day structure
    const stages = [
      { name: 'Fresh', entries: [] },
      { name: 'Anaerobic', entries: [] },
      { name: 'Anaerobic / Alcoholic', entries: [] },
      { name: 'Aerobic', entries: [] },
      { name: 'Aerobic', entries: [] },
      { name: 'Maturation', entries: [] },
      { name: 'Drying Ready', entries: [] },
    ];

    const DAY_MS = 24 * 60 * 60 * 1000;
    const toEpochMs = (v, fallback = Date.now()) => {
      if (v == null) return fallback;
      if (typeof v === 'number' && isFinite(v)) return v;
      const s = String(v).trim();
      if (!s) return fallback;
      if (/^\d+$/.test(s)) return Number(s);
      const parsed = Date.parse(s);
      return Number.isNaN(parsed) ? fallback : parsed;
    };
    const rawStartTime = toEpochMs(selectedBatch.createdAt || selectedBatch.startTime, Date.now());
    let startTime = rawStartTime;

    // Dynamically bucket real-time global entries strictly into this batch's 7-day window
    if (allSensorEntries && allSensorEntries.length > 0) {
      allSensorEntries.forEach(entry => {
        if (!entry || !entry.time) return;
        const entryTime = parseEntryTimeMs(entry);

        // Strictly drop data that is before the start time or after Day 6 (7 days later)
        if (entryTime >= startTime) {
          let dayIndex = Math.floor((entryTime - startTime) / DAY_MS);
          if (dayIndex >= 0 && dayIndex <= 6) {
            stages[dayIndex].entries.push(entry);
          }
        }
      });
    }

    const groups = [];
    let totalR = 0;
    let globalTempSum = 0, globalHumidSum = 0, globalMoistSum = 0;

    stages.forEach((stage, index) => {
      const len = stage.entries.length;
      totalR += len;

      const labels = [], tempDHT1 = [], tempDHT2 = [], humidDHT1 = [], humidDHT2 = [], moisture = [];
      let tempSum = 0, tempMax = 0, humidSum = 0, humidMax = 0, moistSum = 0;

      stage.entries.forEach(e => {
        labels.push(e.time ? String(e.time).split(' ')[1] || String(e.time) : '');
        const t1 = Number(e.tempDHT1 ?? e.temperature ?? 0);
        const t2 = Number(e.tempDHT2 ?? e.temperature ?? 0);
        const h1 = Number(e.humidDHT1 ?? e.humidity ?? 0);
        const h2 = Number(e.humidDHT2 ?? e.humidity ?? 0);
        const m = Number(e.soilMoisture ?? 0);

        tempDHT1.push(t1); tempDHT2.push(t2);
        humidDHT1.push(h1); humidDHT2.push(h2);
        moisture.push(m);

        const avgT = (t1 + t2) / 2;
        const avgH = (h1 + h2) / 2;

        tempSum += avgT; humidSum += avgH; moistSum += m;
        globalTempSum += avgT; globalHumidSum += avgH; globalMoistSum += m;

        if (avgT > tempMax) tempMax = avgT;
        if (avgH > humidMax) humidMax = avgH;
      });

      if (len === 0) {
        labels.push('', '');
        tempDHT1.push(0, 0); tempDHT2.push(0, 0);
        humidDHT1.push(0, 0); humidDHT2.push(0, 0);
        moisture.push(0, 0);
      }

      groups.push({
        dateStr: `Day ${index} — ${stage.name}`,
        entries: stage.entries,
        series: { labels, tempDHT1, tempDHT2, humidDHT1, humidDHT2, moisture, isEmpty: false },
        stats: {
          tempAvg: len ? tempSum / len : 0,
          tempMax,
          humidAvg: len ? humidSum / len : 0,
          humidMax,
          moistAvg: len ? moistSum / len : 0
        }
      });
    });

    const overallStats = {
      tempAvg: totalR ? globalTempSum / totalR : (selectedBatch.avgTemp || 0),
      humidAvg: totalR ? globalHumidSum / totalR : (selectedBatch.avgHumidity || 0),
      moistAvg: totalR ? globalMoistSum / totalR : (selectedBatch.avgMoisture || 0)
    };

    let totalImagesCount = 0;
    if (globalCaptures && globalCaptures.length > 0) {
      globalCaptures.forEach(cap => {
        const t = cap.parsedDate ? cap.parsedDate.getTime() : 0;
        if (t >= startTime) {
          let dayIndex = Math.floor((t - startTime) / DAY_MS);
          if (dayIndex >= 0 && dayIndex <= 6) {
            totalImagesCount++;
          }
        }
      });
    }

    return { dayGroups: groups, totalReadings: totalR, stats: overallStats, totalImages: totalImagesCount };
  }, [selectedBatch, allSensorEntries, globalCaptures, BATCH1_END_MS, parseEntryTimeMs]);

  const isGlobal = selectedBatchId === 'batch-0';
  const activeData = isGlobal ? { ...globalViewData, totalImages: globalCaptures.length } : batchViewData;
  const { overviewSeries, dayGroups, stats, latest, totalReadings, totalImages } = activeData;

  const allBatchesOptions = [
    { id: 'batch-0', name: 'Batch 1', date: 'Starts at 2026-01-08' },
    ...batches
  ];

  const handleDeleteBatch = useCallback((batchId, batchName) => {
    Alert.alert(
      "Delete Batch",
      `Are you sure you want to delete ${batchName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBatch(batchId);
              if (selectedBatchId === batchId) setSelectedBatchId('batch-0');
            } catch (err) {
              Alert.alert("Error", "Could not delete batch.");
            }
          }
        }
      ]
    );
  }, [deleteBatch, selectedBatchId]);

  return (
    <Background variant="gradient">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>

        {/* Header with Batch Selector */}
        <View style={S.header}>
          <TouchableOpacity
            style={[S.headerLeft, { flex: 1, backgroundColor: colors.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[S.iconBg, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="cube" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.sub, { color: colors.subtext }]}>Selected Batch</Text>
              <Text style={[S.title, { color: colors.text, fontSize: 18 }]} numberOfLines={1}>
                {isGlobal ? "Batch 1" : (selectedBatch?.name || selectedBatch?.title || "Unknown")}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {(isLoading || globalLoading) ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[S.dim, { color: colors.subtext }]}>Loading data...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
            {/* ── Hero card ── */}
            <HeroCard
              stats={stats}
              isDark={isDark}
              dayGroupsLength={dayGroups.length}
              totalReadings={totalReadings}
              totalImages={totalImages}
            />

            {/* ── Overview chart (Only for Batch 1) ── */}
            {isGlobal && (
              <>
                <OverviewChartCard
                  overviewSeries={overviewSeries}
                  totalReadings={totalReadings}
                  colors={colors}
                />
              </>
            )}

            {/* ── Charts ── */}
            <SH
              emoji="🗓️"
              title={isGlobal ? "All Historical Stages" : "Fermentation Stages"}
              subtitle={isGlobal ? `${dayGroups.length} calendar dates found` : `${dayGroups.length} days tracking`}
              color="#8B5A2B"
              colors={colors}
            />

            {dayGroups.length === 0 ? (
              <View style={[S.center, { paddingVertical: 32 }]}>
                <Ionicons name="calendar-outline" size={36} color={colors.subtext} />
                <Text style={[S.dim, { color: colors.subtext, marginTop: 8 }]}>No data found for this batch</Text>
              </View>
            ) : (
              dayGroups.map((group, i) => (
                <DayCard
                  key={group.dateStr}
                  index={i}
                  dateStr={group.dateStr}
                  entries={group.entries}
                  series={group.series}
                  stats={group.stats}
                  colors={colors}
                  isDark={isDark}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* Batch Selection Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={S.modalOverlay}>
            <View style={[S.modalContent, { backgroundColor: colors.background }]}>
              <View style={S.modalHeader}>
                <Text style={[S.modalTitle, { color: colors.text }]}>Select Batch</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={S.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={allBatchesOptions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={[S.batchItemWrapper, { borderColor: colors.border, backgroundColor: selectedBatchId === item.id ? colors.primary + '15' : colors.card }]}>
                    <TouchableOpacity
                      style={[S.batchItemContent, { flex: 1 }]}
                      onPress={() => { setSelectedBatchId(item.id); setModalVisible(false); }}
                    >
                      <Ionicons name={selectedBatchId === item.id ? "cube" : "cube-outline"} size={24} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[S.batchItemTitle, { color: colors.text }]}>{item.name || item.title}</Text>
                        <Text style={[S.batchItemDate, { color: colors.subtext }]}>{item.date || "Unknown date"}</Text>
                      </View>
                      {selectedBatchId === item.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginRight: 8 }} />}
                    </TouchableOpacity>

                    {item.id !== 'batch-0' && (
                      <TouchableOpacity
                        style={S.deleteBtn}
                        onPress={() => handleDeleteBatch(item.id, item.name || item.title)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                contentContainerStyle={{ padding: 16 }}
                ListFooterComponent={
                  <TouchableOpacity
                    style={[S.addBatchBtn, { backgroundColor: colors.primary }]}
                    onPress={handleAddBatch}
                    disabled={isCreating}
                  >
                    {isCreating ? <ActivityIndicator color="#fff" /> : <Ionicons name="add" size={24} color="#fff" />}
                    <Text style={S.addBatchTxt}>Create Next Batch</Text>
                  </TouchableOpacity>
                }
              />
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </Background>
  );
}

const S = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 1, fontWeight: "700", textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  dim: { fontSize: 14, fontWeight: "500" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },
  batchItemWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  batchItemContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  batchItemTitle: { fontSize: 16, fontWeight: '700' },
  batchItemDate: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' },
  addBatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, marginTop: 8 },
  addBatchTxt: { color: '#fff', fontSize: 16, fontWeight: '800' }
});