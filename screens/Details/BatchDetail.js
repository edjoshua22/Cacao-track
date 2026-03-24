import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Card from '../../components/Card';
import LineChart from '../../components/LineChart';
import Badge from '../../components/Badge';
import { useAppTheme } from '../../context/ThemeContext';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function BatchDetail() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { batchId, batch } = route.params;
  
  const [batchData, setBatchData] = useState(batch);
  const [loading, setLoading] = useState(!batch);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    if (!batch && batchId) {
      loadBatchData();
    } else if (batch) {
      setBatchData(batch);
    }
  }, [batchId, batch]);

  const loadBatchData = async () => {
    try {
      const db = getDatabase(app);
      const batchRef = ref(db, `batches/${batchId}`);
      const snapshot = await get(batchRef);
      if (snapshot.exists()) {
        setBatchData({ id: batchId, ...snapshot.val() });
      }
    } catch (error) {
      // Error loading batch
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading batch data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!batchData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Batch not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stagesData = batchData.stagesData || {};
  const stages = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];

  const getStageChartData = (dayKey) => {
    const stage = stagesData[dayKey];
    if (!stage || !stage.sensorData || stage.sensorData.length === 0) {
      return { labels: [], tempData: [], humidData: [], moistureData: [] };
    }

    const sortedData = [...stage.sensorData].sort((a, b) => a.timestamp - b.timestamp);
    return {
      labels: sortedData.map((_, idx) => `${idx + 1}`),
      tempData: sortedData.map(d => d.temperature),
      humidData: sortedData.map(d => d.humidity),
      moistureData: sortedData.map(d => d.moisture)
    };
  };

  const getStageStats = (dayKey) => {
    const stage = stagesData[dayKey];
    if (!stage || !stage.sensorData || stage.sensorData.length === 0) {
      return { avgTemp: 0, avgHumidity: 0, avgMoisture: 0, count: 0 };
    }

    const data = stage.sensorData;
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const avgHumidity = data.reduce((sum, d) => sum + d.humidity, 0) / data.length;
    const avgMoisture = data.reduce((sum, d) => sum + d.moisture, 0) / data.length;

    return { avgTemp, avgHumidity, avgMoisture, count: data.length };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.batchName, { color: colors.text }]}>{batchData.name}</Text>
            <Text style={[styles.batchDate, { color: colors.subtext }]}>
              {new Date(batchData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Overall Stats */}
        <Card style={styles.overallCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Temperature</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {batchData.avgTemp?.toFixed(1) || '0.0'}°C
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Humidity</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {batchData.avgHumidity?.toFixed(1) || '0.0'}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Moisture</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {batchData.avgMoisture?.toFixed(1) || '0.0'}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Data Points</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {batchData.dataPoints || 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* All Readings Section - Show current readings even if not in a specific day */}
        {batchData.stagesData?.allReadings && batchData.stagesData.allReadings.length > 0 && (
          <Card style={styles.allReadingsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
              All Readings from Batch Start
            </Text>
            <View style={styles.allReadingsStats}>
              <View style={styles.allReadingsStatItem}>
                <Text style={[styles.allReadingsLabel, { color: colors.subtext }]}>Total Readings</Text>
                <Text style={[styles.allReadingsValue, { color: colors.text }]}>
                  {batchData.stagesData.allReadings.length}
                </Text>
              </View>
              <View style={styles.allReadingsStatItem}>
                <Text style={[styles.allReadingsLabel, { color: colors.subtext }]}>Avg Temp</Text>
                <Text style={[styles.allReadingsValue, { color: colors.text }]}>
                  {(batchData.stagesData.allReadings.reduce((sum, d) => sum + d.temperature, 0) / batchData.stagesData.allReadings.length).toFixed(1)}°C
                </Text>
              </View>
              <View style={styles.allReadingsStatItem}>
                <Text style={[styles.allReadingsLabel, { color: colors.subtext }]}>Avg Humidity</Text>
                <Text style={[styles.allReadingsValue, { color: colors.text }]}>
                  {(batchData.stagesData.allReadings.reduce((sum, d) => sum + d.humidity, 0) / batchData.stagesData.allReadings.length).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.allReadingsStatItem}>
                <Text style={[styles.allReadingsLabel, { color: colors.subtext }]}>Avg Moisture</Text>
                <Text style={[styles.allReadingsValue, { color: colors.text }]}>
                  {(batchData.stagesData.allReadings.reduce((sum, d) => sum + d.moisture, 0) / batchData.stagesData.allReadings.length).toFixed(1)}%
                </Text>
              </View>
            </View>
            
            {/* Chart for all readings */}
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Complete Sensor Trends</Text>
              <LineChart
                labels={batchData.stagesData.allReadings.map((_, idx) => `${idx + 1}`)}
                tempData={batchData.stagesData.allReadings.map(d => d.temperature)}
                humidData={batchData.stagesData.allReadings.map(d => d.humidity)}
                moistureData={batchData.stagesData.allReadings.map(d => d.moisture)}
              />
            </View>
          </Card>
        )}

        {/* Fermentation Stages */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24, marginBottom: 16 }]}>
          Fermentation Stages (Day 0 - Day 6)
        </Text>

        {stages.map((dayKey) => {
          const stage = stagesData[dayKey];
          const stats = getStageStats(dayKey);
          const chartData = getStageChartData(dayKey);
          const isExpanded = selectedStage === dayKey;

          return (
            <Card key={dayKey} style={styles.stageCard}>
              <TouchableOpacity
                onPress={() => setSelectedStage(isExpanded ? null : dayKey)}
                style={styles.stageHeader}
              >
                <View style={styles.stageHeaderContent}>
                  <View>
                    <Text style={[styles.stageTitle, { color: colors.text }]}>
                      {stage?.stageName || dayKey}
                    </Text>
                    <Text style={[styles.stageSubtitle, { color: colors.subtext }]}>
                      {stats.count} readings • {stage?.images?.length || 0} images
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={colors.subtext}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.stageContent}>
                  {/* Stage Stats */}
                  {stats.count > 0 && (
                    <View style={styles.stageStats}>
                      <View style={styles.stageStatItem}>
                        <Text style={[styles.stageStatLabel, { color: colors.subtext }]}>Avg Temp</Text>
                        <Text style={[styles.stageStatValue, { color: colors.text }]}>
                          {stats.avgTemp.toFixed(1)}°C
                        </Text>
                      </View>
                      <View style={styles.stageStatItem}>
                        <Text style={[styles.stageStatLabel, { color: colors.subtext }]}>Avg Humidity</Text>
                        <Text style={[styles.stageStatValue, { color: colors.text }]}>
                          {stats.avgHumidity.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.stageStatItem}>
                        <Text style={[styles.stageStatLabel, { color: colors.subtext }]}>Avg Moisture</Text>
                        <Text style={[styles.stageStatValue, { color: colors.text }]}>
                          {stats.avgMoisture.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Chart */}
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

                  {/* Images */}
                  {stage?.images && stage.images.length > 0 && (
                    <View style={styles.imagesContainer}>
                      <Text style={[styles.imagesTitle, { color: colors.text }]}>Images</Text>
                      <View style={styles.imagesGrid}>
                        {stage.images.map((img, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.imageTile}
                            onPress={() => navigation.navigate('ImageDetail', {
                              imageUrl: img.url,
                              timestamp: img.timestamp,
                              caption: img.stage,
                              quality: img.stage
                            })}
                          >
                            <Image
                              source={{ uri: img.url }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                            <Text style={[styles.imageLabel, { color: colors.subtext }]}>
                              {img.stage}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {stats.count === 0 && (!stage?.images || stage.images.length === 0) && (
                    <View style={styles.emptyStage}>
                      <Text style={[styles.emptyStageText, { color: colors.subtext }]}>
                        No data available for this stage
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  batchName: {
    fontSize: 24,
    fontWeight: '800',
  },
  batchDate: {
    fontSize: 14,
    marginTop: 4,
  },
  overallCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  stageCard: {
    marginBottom: 16,
  },
  stageHeader: {
    paddingVertical: 8,
  },
  stageHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stageSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  stageContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  stageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  stageStatItem: {
    alignItems: 'center',
  },
  stageStatLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  stageStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagesContainer: {
    marginTop: 16,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageTile: {
    width: (width - 64) / 3,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  emptyStage: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStageText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  allReadingsCard: {
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8B5A2B',
  },
  allReadingsStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 90, 43, 0.05)',
    borderRadius: 12,
  },
  allReadingsStatItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  allReadingsLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  allReadingsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
