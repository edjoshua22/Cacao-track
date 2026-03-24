import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue, get, getDatabase } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import Card from "../components/Card";
import Badge from "../components/Badge";
import LineChart from "../components/LineChart";
import Background from "../components/Background";
import { theme } from "../theme";
import { useAppTheme } from "../context/ThemeContext";
import { app } from "../firebaseConfig";

const { width } = Dimensions.get('window');

export default function MonitoringScreen() {
  const { colors, isDark } = useAppTheme();
  const db = getDatabase(app);

  // Individual sensor values
  const [tempDHT1, setTempDHT1] = useState(0);
  const [tempDHT2, setTempDHT2] = useState(0);
  const [humidDHT1, setHumidDHT1] = useState(0);
  const [humidDHT2, setHumidDHT2] = useState(0);
  const [avgTemp, setAvgTemp] = useState(0);
  const [avgHumidity, setAvgHumidity] = useState(0);
  const [moisture, setMoisture] = useState(0);
  const [lastDataTime, setLastDataTime] = useState(0);
  
  // Chart data
  const [labels, setLabels] = useState([]);
  const [tempDHT1Data, setTempDHT1Data] = useState([]);
  const [tempDHT2Data, setTempDHT2Data] = useState([]);
  const [humidDHT1Data, setHumidDHT1Data] = useState([]);
  const [humidDHT2Data, setHumidDHT2Data] = useState([]);
  const [moistData, setMoistData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    const listeners = [];
    let dataTimeout = null;

    // Function to clear all sensor values to 0
    const clearSensorValues = () => {
      setTempDHT1(0);
      setHumidDHT1(0);
      setTempDHT2(0);
      setHumidDHT2(0);
      setAvgTemp(0);
      setAvgHumidity(0);
      setMoisture(0);
    };

    // Function to reset timeout when data is received
    const resetDataTimeout = () => {
      if (dataTimeout) clearTimeout(dataTimeout);
      dataTimeout = setTimeout(() => {
        clearSensorValues();
      }, 10000); // Clear to 0 after 10 seconds of no data (more aggressive)
    };

    // Clear values immediately on start if no IoT is connected
    clearSensorValues(); // Start with 0 values

    // Latest values from Firebase nodes
    const dht1Ref = ref(db, "DHT1");
    const dht2Ref = ref(db, "DHT2");
    const averageRef = ref(db, "Average");

    // DHT1 sensor
    const dht1Unsubscribe = onValue(dht1Ref, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data != null) {
          const currentTime = Date.now();
          const dataAge = currentTime - (data.timestamp || currentTime);
          const maxAge = 5000; // 5 seconds (more aggressive for disconnected IoT)
          
          if (dataAge < maxAge) {
            setTempDHT1(Number(data.temperature) ?? 0);
            setHumidDHT1(Number(data.humidity) ?? 0);
            setLastDataTime(currentTime);
            resetDataTimeout(); // Reset timeout on fresh data
          } else {
            // Data is too old, show 0
            setTempDHT1(0);
            setHumidDHT1(0);
          }
        } else {
          setTempDHT1(0);
          setHumidDHT1(0);
        }
      } else {
        setTempDHT1(0);
        setHumidDHT1(0);
      }
    });
    listeners.push(dht1Unsubscribe);

    // DHT2 sensor
    const dht2Unsubscribe = onValue(dht2Ref, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data != null) {
          const currentTime = Date.now();
          const dataAge = currentTime - (data.timestamp || currentTime);
          const maxAge = 5000; // 5 seconds (more aggressive for disconnected IoT)
          
          if (dataAge < maxAge) {
            setTempDHT2(Number(data.temperature) ?? 0);
            setHumidDHT2(Number(data.humidity) ?? 0);
            setMoisture(Number(data.soilMoisture) ?? 0);
            if (data.lastUpdate) setLastUpdate(data.lastUpdate);
            setLastDataTime(currentTime);
            resetDataTimeout(); // Reset timeout on fresh data
          } else {
            // Data is too old, show 0
            setTempDHT2(0);
            setHumidDHT2(0);
            setMoisture(0);
          }
        } else {
          setTempDHT2(0);
          setHumidDHT2(0);
          setMoisture(0);
        }
      } else {
        setTempDHT2(0);
        setHumidDHT2(0);
        setMoisture(0);
      }
    });
    listeners.push(dht2Unsubscribe);

    // Average values
    const averageUnsubscribe = onValue(averageRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data != null) {
          const currentTime = Date.now();
          const dataAge = currentTime - (data.timestamp || currentTime);
          const maxAge = 5000; // 5 seconds (more aggressive for disconnected IoT)
          
          if (dataAge < maxAge) {
            setAvgTemp(Number(data.temperature) ?? 0);
            setAvgHumidity(Number(data.humidity) ?? 0);
            setLastDataTime(currentTime);
            resetDataTimeout(); // Reset timeout on fresh data
          } else {
            // Data is too old, show 0
            setAvgTemp(0);
            setAvgHumidity(0);
          }
        } else {
          setAvgTemp(0);
          setAvgHumidity(0);
        }
      } else {
        setAvgTemp(0);
        setAvgHumidity(0);
      }
    });
    listeners.push(averageUnsubscribe);

    // History for chart - read from sensorData with limit
    const sensorRef = ref(db, "sensorData");
    const sensorUnsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data != null) {
          let entries = Object.entries(data).map(([_, val]) => ({
            ...val,
          }));

          // Sort by timestamp
          entries.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

          // Last 20 points
          if (entries.length > 20) {
            entries = entries.slice(entries.length - 20);
          }

          // Extract data for each sensor
          const safeTempDHT1 = entries.map((e) =>
            isFinite(Number(e.tempDHT1 ?? e.temp1 ?? e.temp ?? e.temperature)) 
              ? Number(e.tempDHT1 ?? e.temp1 ?? e.temp ?? e.temperature) 
              : 0
          );
          const safeTempDHT2 = entries.map((e) =>
            isFinite(Number(e.tempDHT2 ?? e.temp2 ?? e.temp ?? e.temperature)) 
              ? Number(e.tempDHT2 ?? e.temp2 ?? e.temp ?? e.temperature) 
              : 0
          );
          const safeHumidDHT1 = entries.map((e) =>
            isFinite(Number(e.humidDHT1 ?? e.humidity1 ?? e.humidity)) 
              ? Number(e.humidDHT1 ?? e.humidity1 ?? e.humidity) 
              : 0
          );
          const safeHumidDHT2 = entries.map((e) =>
            isFinite(Number(e.humidDHT2 ?? e.humidity2 ?? e.humidity)) 
              ? Number(e.humidDHT2 ?? e.humidity2 ?? e.humidity) 
              : 0
          );
          const safeMoist = entries.map((e) =>
            isFinite(Number(e.soilMoisture)) ? Number(e.soilMoisture) : 0
          );
          const safeLabels = entries.map((e) => (e.time ? String(e.time) : ""));

          setTempDHT1Data(safeTempDHT1);
          setTempDHT2Data(safeTempDHT2);
          setHumidDHT1Data(safeHumidDHT1);
          setHumidDHT2Data(safeHumidDHT2);
          setMoistData(safeMoist);
          setLabels(safeLabels);
        }
      }
      // Don't clear chart data if snapshot doesn't exist - keep existing data
    });
    listeners.push(sensorUnsubscribe);

    // Cleanup all listeners when component unmounts
    return () => {
      if (dataTimeout) clearTimeout(dataTimeout);
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return (
    <Background variant="waves">
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Hero Card */}
          <LinearGradient
            colors={isDark ? ['#8B5A2B', '#6B4423'] : ['#FDB95D', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative elements */}
            <View style={[styles.heroDeco1, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)' }]} />
            <View style={[styles.heroDeco2, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)' }]} />
            
            <View style={styles.heroHeader}>
              <View>
                <Text style={[styles.heroTitle, { color: isDark ? '#F5E9DD' : '#FFFFFF' }]}>
                  {avgTemp.toFixed(1)}°C
                </Text>
                <Text style={[styles.heroSubtitle, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)' }]}>
                  Temperature
                </Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="leaf" size={40} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)'} />
              </View>
            </View>

            {/* Three Key Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: isDark ? '#F5E9DD' : '#FFFFFF' }]}>
                  {avgHumidity.toFixed(1)}%
                </Text>
                <Text style={[styles.metricLabel, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)' }]}>
                  Humidity
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: isDark ? '#F5E9DD' : '#FFFFFF' }]}>
                  {moisture.toFixed(1)}%
                </Text>
                <Text style={[styles.metricLabel, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)' }]}>
                  Moisture
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.metricItem}>
                <Badge type="overall" value={avgTemp} humidity={avgHumidity} />
              </View>
            </View>
          </LinearGradient>

          {/* Detailed Metrics Section */}
          <View style={styles.sectionLabel}>
            <LinearGradient
              colors={[colors.primary + '40', colors.primary + '00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionLabelGradient}
            >
              <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sensor Details</Text>
            </LinearGradient>
          </View>

          {/* Temperature Group - CLEAN VERSION */}
          <View style={styles.metricGroup}>
            <View style={[styles.cleanGroupCard, { 
              backgroundColor: colors.card,
              borderLeftColor: '#EF4444',
              borderLeftWidth: 4,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            }]}>
              <View style={[styles.cleanHeader, { 
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <View style={[styles.cleanIconCircle, { backgroundColor: '#EF444410' }]}>
                  <Ionicons name="thermometer" size={24} color="#EF4444" />
                </View>
                <View style={styles.cleanHeaderText}>
                  <Text style={[styles.cleanTitle, { color: colors.text }]}>
                    Temperature
                  </Text>
                  <View style={styles.cleanValueRow}>
                    <Text style={[styles.cleanValue, { color: '#EF4444' }]}>
                      {avgTemp.toFixed(1)}°C
                    </Text>
                    <Text style={[styles.cleanSubtext, { color: colors.subtext }]}>
                      Average
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanSensorGrid}>
                <View style={[styles.cleanSensorCard, { 
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
                }]}>
                  <View style={styles.cleanSensorTop}>
                    <Ionicons name="thermometer-outline" size={16} color="#EF4444" />
                    <Text style={[styles.cleanSensorLabel, { color: colors.subtext }]}>
                      Sensor 1
                    </Text>
                  </View>
                  <Text style={[styles.cleanSensorValue, { color: colors.text }]}>
                    {tempDHT1.toFixed(1)}°C
                  </Text>
                  <Badge type="temperature" value={parseFloat(tempDHT1)} humidity={humidDHT1} />
                </View>

                <View style={[styles.cleanSensorCard, { 
                  backgroundColor: isDark ? 'rgba(248, 113, 113, 0.08)' : 'rgba(248, 113, 113, 0.04)',
                }]}>
                  <View style={styles.cleanSensorTop}>
                    <Ionicons name="thermometer-outline" size={16} color="#F87171" />
                    <Text style={[styles.cleanSensorLabel, { color: colors.subtext }]}>
                      Sensor 2
                    </Text>
                  </View>
                  <Text style={[styles.cleanSensorValue, { color: colors.text }]}>
                    {tempDHT2.toFixed(1)}°C
                  </Text>
                  <Badge type="temperature" value={parseFloat(tempDHT2)} humidity={humidDHT2} />
                </View>
              </View>
            </View>
          </View>

          {/* Humidity Group - CLEAN VERSION */}
          <View style={styles.metricGroup}>
            <View style={[styles.cleanGroupCard, { 
              backgroundColor: colors.card,
              borderLeftColor: '#3B82F6',
              borderLeftWidth: 4,
              borderColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            }]}>
              <View style={[styles.cleanHeader, { 
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <View style={[styles.cleanIconCircle, { backgroundColor: '#3B82F610' }]}>
                  <Ionicons name="water" size={24} color="#3B82F6" />
                </View>
                <View style={styles.cleanHeaderText}>
                  <Text style={[styles.cleanTitle, { color: colors.text }]}>
                    Humidity
                  </Text>
                  <View style={styles.cleanValueRow}>
                    <Text style={[styles.cleanValue, { color: '#3B82F6' }]}>
                      {avgHumidity.toFixed(1)}%
                    </Text>
                    <Text style={[styles.cleanSubtext, { color: colors.subtext }]}>
                      Average
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanSensorGrid}>
                <View style={[styles.cleanSensorCard, { 
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                }]}>
                  <View style={styles.cleanSensorTop}>
                    <Ionicons name="water-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.cleanSensorLabel, { color: colors.subtext }]}>
                      Sensor 1
                    </Text>
                  </View>
                  <Text style={[styles.cleanSensorValue, { color: colors.text }]}>
                    {humidDHT1.toFixed(1)}%
                  </Text>
                  <Badge type="humidity" value={parseFloat(humidDHT1)} humidity={humidDHT1} />
                </View>

                <View style={[styles.cleanSensorCard, { 
                  backgroundColor: isDark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(96, 165, 250, 0.04)',
                }]}>
                  <View style={styles.cleanSensorTop}>
                    <Ionicons name="water-outline" size={16} color="#60A5FA" />
                    <Text style={[styles.cleanSensorLabel, { color: colors.subtext }]}>
                      Sensor 2
                    </Text>
                  </View>
                  <Text style={[styles.cleanSensorValue, { color: colors.text }]}>
                    {humidDHT2.toFixed(1)}%
                  </Text>
                  <Badge type="humidity" value={parseFloat(humidDHT2)} humidity={humidDHT2} />
                </View>
              </View>
            </View>
          </View>

          {/* Moisture Group - CLEAN VERSION */}
          <View style={styles.metricGroup}>
            <View style={[styles.cleanGroupCard, { 
              backgroundColor: colors.card,
              borderLeftColor: '#10B981',
              borderLeftWidth: 4,
              borderColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
            }]}>
              <View style={[styles.cleanHeader, { 
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <View style={[styles.cleanIconCircle, { backgroundColor: '#10B98110' }]}>
                  <Ionicons name="leaf" size={24} color="#10B981" />
                </View>
                <View style={styles.cleanHeaderText}>
                  <Text style={[styles.cleanTitle, { color: colors.text }]}>
                    Soil Moisture
                  </Text>
                  <View style={styles.cleanValueRow}>
                    <Text style={[styles.cleanValue, { color: '#10B981' }]}>
                      {moisture.toFixed(1)}%
                    </Text>
                    <Text style={[styles.cleanSubtext, { color: colors.subtext }]}>
                      Current
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanSensorGrid}>
                <View style={[styles.cleanSensorCard, { 
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                  width: '100%',
                }]}>
                  <View style={styles.cleanSensorTop}>
                    <Ionicons name="leaf-outline" size={16} color="#10B981" />
                    <Text style={[styles.cleanSensorLabel, { color: colors.subtext }]}>
                      Moisture Level
                    </Text>
                  </View>
                  <Text style={[styles.cleanSensorValue, { color: colors.text }]}>
                    {moisture.toFixed(1)}%
                  </Text>
                  <Badge type="overall" value={avgTemp} humidity={avgHumidity} />
                </View>
              </View>
            </View>
          </View>

          {/* Overall Status Card */}
          <View style={styles.statusSectionLabel}>
            <View style={[styles.statusSectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statusSectionTitle, { color: colors.text }]}>Overview</Text>
          </View>

          <LinearGradient
            colors={isDark ? ['#1F1F1F', '#0A0A0A'] : ['#E8F7F1', '#D1F0E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statusCard, { 
              borderColor: '#10B981' + '40',
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'
            }]}
          >
            <View style={styles.statusCardContent}>
              <View style={styles.statusIconSection}>
                <LinearGradient
                  colors={['#10B98130', '#10B98110']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.statusIconBadge, { borderColor: '#10B981' + '60' }]}
                >
                  <Ionicons name="analytics-outline" size={36} color="#10B981" />
                </LinearGradient>
              </View>
              
              <View style={styles.statusInfo}>
                <Text style={[styles.statusCardTitle, { color: colors.text }]}>
                  Fermentation Status
                </Text>
                <Badge type="overall" value={avgTemp} humidity={avgHumidity} />
                {lastUpdate && (
                  <Text style={[styles.statusUpdateTime, { color: colors.subtext }]}>
                    Updated: {lastUpdate}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.statusAccentLine, { backgroundColor: '#10B981' }]} />
          </LinearGradient>

          {/* Chart Card */}
          <View style={styles.chartSectionLabel}>
            <View style={[styles.chartSectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.chartSectionTitle, { color: colors.text }]}>Analytics</Text>
          </View>

          <LinearGradient
            colors={isDark ? ['#1F1F1F', '#0A0A0A'] : ['#F0E7FF', '#E8D9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chartCard, { 
              borderColor: '#A78BFA' + '40',
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'
            }]}
          >
            <View style={styles.chartCardContent}>
              <View style={styles.chartHeaderContainer}>
                <View style={styles.chartIconSection}>
                  <LinearGradient
                    colors={['#A78BFA30', '#A78BFA10']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.chartIconBadge, { borderColor: '#A78BFA' + '60' }]}
                  >
                    <Ionicons name="trending-up-outline" size={36} color="#A78BFA" />
                  </LinearGradient>
                </View>

                <View style={styles.chartTitleSection}>
                  <Text style={[styles.chartCardTitle, { color: colors.text }]}>
                    Sensor Trends
                  </Text>
                  <Text style={[styles.chartCardSubtitle, { color: colors.subtext }]}>
                    Historical data from sensors
                  </Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <LineChart 
                  labels={labels} 
                  tempDHT1Data={tempDHT1Data}
                  tempDHT2Data={tempDHT2Data}
                  humidDHT1Data={humidDHT1Data}
                  humidDHT2Data={humidDHT2Data}
                  moistureData={moistData} 
                />
              </View>
            </View>
            <View style={[styles.chartAccentLine, { backgroundColor: '#A78BFA' }]} />
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDeco1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -30,
    right: -30,
  },
  heroDeco2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: 20,
    left: -20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  heroIcon: {
    opacity: 0.6,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sectionLabel: {
    marginBottom: 20,
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  sectionLabelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricGroup: {
    marginBottom: 24,
  },
  
  // NEW CLEAN CARD STYLES
  cleanGroupCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
  },
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  cleanIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cleanHeaderText: {
    flex: 1,
  },
  cleanTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
    marginBottom: 6,
  },
  cleanValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cleanValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cleanSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  cleanSensorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cleanSensorCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  cleanSensorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  cleanSensorLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cleanSensorValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  
  // STATUS AND CHART CARDS
  statusSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  statusSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 0,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  statusCardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconSection: {
    marginRight: 16,
  },
  statusIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusInfo: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  statusUpdateTime: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  statusAccentLine: {
    height: 3,
    width: '100%',
  },
  chartSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  chartSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  chartSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  chartCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 0,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  chartCardContent: {
    padding: 20,
  },
  chartHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  chartIconSection: {
    marginRight: 14,
  },
  chartIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  chartTitleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  chartCardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartAccentLine: {
    height: 3,
    width: '100%',
  },
});