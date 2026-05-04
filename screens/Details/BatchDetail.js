/**
 * BatchDetail.js
 * Full detail view for a single fermentation batch.
 * Refactored: sub-components extracted, styles in DetailStyles, utils in batchDetailUtils.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView }           from 'react-native-safe-area-context';
import { Ionicons }               from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDatabase, ref, get }  from 'firebase/database';
import Card                       from '../../components/Card';
import LineChart                  from '../../components/LineChart';
import { useAppTheme }            from '../../context/ThemeContext';
import { app }                    from '../../firebaseConfig.secure';
import { detailStyles as shared } from './DetailStyles';
import { getStageChartData, getStageStats, getAllReadingsStats } from './batchDetailUtils';
import { StyleSheet } from 'react-native';

const { width }    = Dimensions.get('window');
const STAGES       = ['day0','day1','day2','day3','day4','day5','day6'];
const IMAGE_TILE_W = (width - 64) / 3;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Overall average stats grid. */
const OverallStats = React.memo(({ batchData, colors }) => (
  <Card style={styles.overallCard}>
    <Text style={[shared.sectionTitle, { color: colors.text }]}>Overall Statistics</Text>
    <View style={styles.statsGrid}>
      {[
        { label: 'Temperature', value: `${batchData.avgTemp?.toFixed(1) || '0.0'}°C` },
        { label: 'Humidity',    value: `${batchData.avgHumidity?.toFixed(1) || '0.0'}%` },
        { label: 'Moisture',    value: `${batchData.avgMoisture?.toFixed(1) || '0.0'}%` },
        { label: 'Data Points', value: `${batchData.dataPoints || 0}` },
      ].map(({ label, value }) => (
        <View key={label} style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  </Card>
));

/** All-readings summary card shown when batch has global allReadings. */
const AllReadingsCard = React.memo(({ allReadings, colors }) => {
  const stats = useMemo(() => getAllReadingsStats(allReadings), [allReadings]);
  const labels = useMemo(() => allReadings.map((_, i) => `${i + 1}`), [allReadings]);
  const tempData     = useMemo(() => allReadings.map(d => d.temperature), [allReadings]);
  const humidData    = useMemo(() => allReadings.map(d => d.humidity),    [allReadings]);
  const moistureData = useMemo(() => allReadings.map(d => d.moisture),    [allReadings]);

  return (
    <Card style={styles.allReadingsCard}>
      <Text style={[shared.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
        All Readings from Batch Start
      </Text>
      <View style={styles.allReadingsStats}>
        {[
          { label: 'Total Readings', value: stats.total },
          { label: 'Avg Temp',       value: `${stats.avgTemp}°C` },
          { label: 'Avg Humidity',   value: `${stats.avgHumidity}%` },
          { label: 'Avg Moisture',   value: `${stats.avgMoisture}%` },
        ].map(({ label, value }) => (
          <View key={label} style={styles.allReadingsStat}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
            <Text style={[styles.allReadingsValue, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
      </View>
      <Text style={[shared.sectionTitle, { color: colors.text, fontSize: 16, marginTop: 12 }]}>
        Complete Sensor Trends
      </Text>
      <LineChart
        labels={labels}
        tempData={tempData}
        humidData={humidData}
        moistureData={moistureData}
      />
    </Card>
  );
});

/** Tappable image tile inside a stage. */
const ImageTile = React.memo(({ img, navigation }) => {
  const onPress = useCallback(() => navigation.navigate('ImageDetail', {
    imageUrl: img.url, timestamp: img.timestamp, caption: img.stage, quality: img.stage,
  }), [img, navigation]);

  return (
    <TouchableOpacity style={styles.imageTile} onPress={onPress}>
      <Image source={{ uri: img.url }} style={styles.thumbImage} resizeMode="cover" />
      <Text style={styles.imageLabel}>{img.stage}</Text>
    </TouchableOpacity>
  );
});

/** Expandable stage accordion card. */
const StageCard = React.memo(({ dayKey, stagesData, colors, navigation }) => {
  const [expanded, setExpanded] = useState(false);
  const stage     = stagesData?.[dayKey];
  const stats     = useMemo(() => getStageStats(stagesData, dayKey),     [stagesData, dayKey]);
  const chartData = useMemo(() => getStageChartData(stagesData, dayKey), [stagesData, dayKey]);

  const toggleExpand = useCallback(() => setExpanded(p => !p), []);

  return (
    <Card style={styles.stageCard}>
      <TouchableOpacity onPress={toggleExpand} style={styles.stageHeader}>
        <View style={styles.stageHeaderContent}>
          <View>
            <Text style={[styles.stageTitle, { color: colors.text }]}>{stage?.stageName || dayKey}</Text>
            <Text style={[styles.stageSubtitle, { color: colors.subtext }]}>
              {stats.count} readings · {stage?.images?.length || 0} images
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.subtext} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.stageContent}>
          {stats.count > 0 && (
            <View style={styles.stageStats}>
              {[
                { label: 'Avg Temp',     value: `${stats.avgTemp.toFixed(1)}°C` },
                { label: 'Avg Humidity', value: `${stats.avgHumidity.toFixed(1)}%` },
                { label: 'Avg Moisture', value: `${stats.avgMoisture.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <View key={label} style={styles.stageStatItem}>
                  <Text style={[styles.statLabel,     { color: colors.subtext }]}>{label}</Text>
                  <Text style={[styles.stageStatValue, { color: colors.text }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {chartData.tempData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Sensor Trends</Text>
              <LineChart
                labels={chartData.labels}
                tempData={chartData.tempData}
                humidData={chartData.humidData}
                moistureData={chartData.moistureData}
              />
            </View>
          )}

          {stage?.images?.length > 0 && (
            <View>
              <Text style={[styles.chartTitle, { color: colors.text, marginTop: 12 }]}>Images</Text>
              <View style={styles.imagesGrid}>
                {stage.images.map((img, idx) => (
                  <ImageTile key={idx} img={img} navigation={navigation} />
                ))}
              </View>
            </View>
          )}

          {stats.count === 0 && !stage?.images?.length && (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No data available for this stage
            </Text>
          )}
        </View>
      )}
    </Card>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

/**
 * BatchDetail — full analytics and images for one fermentation batch.
 * Receives route params: batchId, batch.
 */
const BatchDetail = () => {
  const { colors }        = useAppTheme();
  const navigation        = useNavigation();
  const route             = useRoute();
  const { batchId, batch } = route.params;

  const [batchData, setBatchData] = useState(batch ?? null);
  const [loading,   setLoading]   = useState(!batch);

  useEffect(() => {
    if (!batch && batchId) {
      const load = async () => {
        try {
          const db       = getDatabase(app);
          const snapshot = await get(ref(db, `batches/${batchId}`));
          if (snapshot.exists()) setBatchData({ id: batchId, ...snapshot.val() });
        } finally {
          setLoading(false);
        }
      };
      load();
    } else if (batch) {
      setBatchData(batch);
    }
  }, [batchId, batch]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={shared.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading batch data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!batchData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={shared.centered}>
          <Text style={[shared.errorText, { color: colors.text }]}>Batch not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allReadings = batchData.stagesData?.allReadings;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.batchName, { color: colors.text }]}>{batchData.name}</Text>
            <Text style={[shared.batchSubtitle, { color: colors.subtext }]}>
              {new Date(batchData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <OverallStats batchData={batchData} colors={colors} />

        {allReadings?.length > 0 && (
          <AllReadingsCard allReadings={allReadings} colors={colors} />
        )}

        <Text style={[shared.sectionTitle, { color: colors.text, marginTop: 24, marginBottom: 16 }]}>
          Fermentation Stages (Day 0 – Day 6)
        </Text>

        {STAGES.map(dayKey => (
          <StageCard
            key={dayKey}
            dayKey={dayKey}
            stagesData={batchData.stagesData}
            colors={colors}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BatchDetail;

// ── Local styles (supplement shared) ─────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1 },
  scrollContent:    { padding: 16 },
  loadingText:      { marginTop: 12, fontSize: 14 },
  header:           { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton:       { marginRight: 12, padding: 4 },
  batchName:        { fontSize: 24, fontWeight: '800' },
  overallCard:      { marginBottom: 24 },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  statItem:         { width: '48%', marginBottom: 16 },
  statLabel:        { fontSize: 12, marginBottom: 4 },
  statValue:        { fontSize: 20, fontWeight: '700' },
  allReadingsCard:  { marginBottom: 24, borderWidth: 2, borderColor: '#8B5A2B' },
  allReadingsStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, backgroundColor: 'rgba(139,90,43,0.05)', borderRadius: 12 },
  allReadingsStat:  { alignItems: 'center', width: '48%', marginBottom: 8 },
  allReadingsValue: { fontSize: 18, fontWeight: '700' },
  stageCard:        { marginBottom: 16 },
  stageHeader:      { paddingVertical: 8 },
  stageHeaderContent:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageTitle:       { fontSize: 18, fontWeight: '700' },
  stageSubtitle:    { fontSize: 12, marginTop: 4 },
  stageContent:     { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  stageStats:       { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12 },
  stageStatItem:    { alignItems: 'center' },
  stageStatValue:   { fontSize: 16, fontWeight: '700' },
  chartContainer:   { marginBottom: 16 },
  chartTitle:       { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  imagesGrid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  imageTile:        { width: IMAGE_TILE_W, marginBottom: 12 },
  thumbImage:       { width: '100%', height: 100, borderRadius: 8, marginBottom: 4 },
  imageLabel:       { fontSize: 10, textAlign: 'center' },
  emptyText:        { padding: 24, textAlign: 'center', fontStyle: 'italic', fontSize: 14 },
});
