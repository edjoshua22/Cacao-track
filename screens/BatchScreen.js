import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Background from "../components/Background";
import { useAppTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { getDatabase, ref, onValue, off, remove, get } from "firebase/database";
import { app } from "../firebaseConfig";
import { initializeAuth, getUserId } from "../utils/authUtils";
import { exportCSV, exportPDF, exportImagesPDF } from "../utils/exportUtils";
import { exportImagesPDFOptimized } from "../utils/imageExportUtils";
import { logProductionError } from "../utils/debugUtils";
import LineChart from "../components/LineChart";
import { LinearGradient } from "expo-linear-gradient";

const db = getDatabase(app);

// Internal component for daily graph moved outside to prevent remounting
const DailyGraph = React.memo(({ dayKey, dayData, index, colors }) => {
  if (!dayData || !dayData.sensorData || !Array.isArray(dayData.sensorData) || dayData.sensorData.length === 0) {
    return (
      <View style={styles.dayCard}>
        <LinearGradient
          colors={['rgba(139, 90, 43, 0.15)', 'rgba(139, 90, 43, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dayHeaderGradient}
        >
          <Text style={[styles.dayTitle, { color: colors.text }]}>
            Day {index} – {dayData?.stageName || "Unknown"}
          </Text>
        </LinearGradient>
        <View style={styles.noDataPlaceholder}>
          <Ionicons name="stats-chart-outline" size={32} color={colors.subtext} />
          <Text style={{ color: colors.subtext, marginTop: 8, fontSize: 13, fontWeight: '500' }}>No sensor data recorded for this stage</Text>
        </View>
      </View>
    );
  }

  // Process sensorData into chart format efficiently
  const labels = [];
  const tempDHT1 = [];
  const tempDHT2 = [];
  const humidDHT1 = [];
  const humidDHT2 = [];
  const moist = [];

  for (const e of dayData.sensorData) {
    labels.push(e.time ? String(e.time).split(' ')[1] || String(e.time) : "");
    tempDHT1.push(Number(e.tempDHT1 ?? e.temperature ?? 0));
    tempDHT2.push(Number(e.tempDHT2 ?? e.temperature ?? 0));
    humidDHT1.push(Number(e.humidDHT1 ?? e.humidity ?? 0));
    humidDHT2.push(Number(e.humidDHT2 ?? e.humidity ?? 0));
    moist.push(Number(e.soilMoisture ?? 0));
  }

  return (
    <View style={styles.dayCard}>
      <LinearGradient
        colors={['rgba(139, 90, 43, 0.2)', 'rgba(139, 90, 43, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dayHeaderGradient}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.dayTitle, { color: colors.text }]}>
            Day {index} – {dayData.stageName}
          </Text>
          <Ionicons name="analytics" size={18} color="#8B5A2B" />
        </View>
      </LinearGradient>
      
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
    </View>
  );
});

const DAY_MS = 24 * 60 * 60 * 1000;

export default function BatchScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [userBatches, setUserBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  // Memoize batch processing to prevent unnecessary re-renders
  const processBatchData = useCallback((batchData, batchId) => {
    try {
      // Create skeleton days if they don't exist
      const processedBatch = {
        id: batchId,
        ...batchData,
        relevantData: [],
        day0: { stageName: "Fresh", sensorData: [] },
        day1: { stageName: "Anaerobic", sensorData: [] },
        day2: { stageName: "Anaerobic / Alcoholic", sensorData: [] },
        day3: { stageName: "Aerobic", sensorData: [] },
        day4: { stageName: "Aerobic", sensorData: [] },
        day5: { stageName: "Maturation", sensorData: [] },
        day6: { stageName: "Drying Ready", sensorData: [] },
      };

      // Group raw sensor data by day if it exists
      if (batchData.sensorData) {
        const startTime = parseInt(batchData.createdAt || batchData.startTime || Date.now());
        
        // Convert to array if it's an object from Firebase
        const sensorEntries = Array.isArray(batchData.sensorData) 
          ? batchData.sensorData 
          : Object.values(batchData.sensorData);

        sensorEntries.forEach(entry => {
          if (!entry || !entry.time) return;
          
          // Assuming entry.timestamp exists, otherwise try to parse the time string
          let entryTime = entry.timestamp;
          if (!entryTime) {
            // Attempt to parse "YYYY-MM-DD HH:mm:ss" if timestamp isn't present
            const parsedTime = new Date(entry.time.replace(/-/g, '/')).getTime();
            entryTime = isNaN(parsedTime) ? startTime : parsedTime;
          }
          
          // Calculate day index (0-6)
          const timeDiff = entryTime - startTime;
          let dayIndex = Math.floor(timeDiff / DAY_MS);
          
          // Clamp to 0-6 to fit our expected stages
          if (dayIndex < 0) dayIndex = 0;
          if (dayIndex > 6) dayIndex = 6;
          
          const dayKey = `day${dayIndex}`;
          if (processedBatch[dayKey]) {
            processedBatch[dayKey].sensorData.push(entry);
          }
        });

        // Ensure each day's data is sorted chronologically
        for (let i = 0; i <= 6; i++) {
          const dayKey = `day${i}`;
          processedBatch[dayKey].sensorData.sort((a, b) => {
            const timeA = a.timestamp || new Date(a.time.replace(/-/g, '/')).getTime();
            const timeB = b.timestamp || new Date(b.time.replace(/-/g, '/')).getTime();
            return timeA - timeB;
          });
        }
      }

      return processedBatch;
    } catch (error) {
      logProductionError(error, 'BatchScreen.ProcessBatchData');
      return {
        id: batchId,
        ...batchData,
        relevantData: [],
      };
    }
  }, []);

  // Sorted batches (user-only for performance – no global scan)
  const sortedBatches = useMemo(() => {
    return [...userBatches].sort((a, b) => (parseInt(b.createdAt) || 0) - (parseInt(a.createdAt) || 0));
  }, [userBatches]);

  useEffect(() => {
    let unsubscribeUser = null;
    
    const setupListeners = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        // Only listen to the current user's batches — avoid reading the entire /batches node
        const userRef = ref(db, "batches/" + userId);

        unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const processed = Object.entries(data).map(([id, batch]) => processBatchData(batch, id));
            setUserBatches(processed);
          } else {
            setUserBatches([]);
          }
          setLoading(false);
          setError(null);
        }, (err) => {
          logProductionError(err, 'BatchScreen.UserListener');
          setLoading(false);
        });

      } catch (err) {
        logProductionError(err, 'BatchScreen.Setup');
        setError('Failed to setup listeners');
        setLoading(false);
      }
    };
    
    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [processBatchData]);

  const deleteBatch = useCallback(async (id, name) => {
    Alert.alert(
      "Delete Batch",
      `Are you sure you want to delete batch "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await initializeAuth();
              const userId = getUserId();
              
              if (!userId) {
                throw new Error('User not authenticated');
              }
              
              // Try user-specific path first
              try {
                const userPathRef = ref(db, "batches/" + userId + "/" + id);
                
                // Check if batch exists at this path first
                const batchSnapshot = await get(userPathRef);
                
                if (batchSnapshot.exists()) {
                  await remove(userPathRef);
                  Alert.alert("Deleted", "Batch \"" + name + "\" deleted successfully.");
                } else {
                  // Try global path
                  throw new Error('Batch not found in user path');
                }
              } catch (userPathError) {
                // If user path fails, try global path
                try {
                  const globalPathRef = ref(db, "batches/" + id);
                  
                  // Check if batch exists at global path
                  const globalBatchSnapshot = await get(globalPathRef);
                  
                  if (globalBatchSnapshot.exists()) {
                    await remove(globalPathRef);
                    Alert.alert("Deleted", "Batch \"" + name + "\" deleted successfully.");
                  } else {
                    throw new Error('Batch not found in global path');
                  }
                } catch (globalPathError) {
                  // Check if it's a permissions issue
                  if (userPathError.code === 'PERMISSION_DENIED' || globalPathError.code === 'PERMISSION_DENIED') {
                    Alert.alert("Permission Error", "You don't have permission to delete batches. Check Firebase security rules.");
                  } else {
                    Alert.alert("Error", "Failed to delete batch: Batch not found in either location.");
                  }
                  throw new Error('Failed to delete from both user and global paths');
                }
              }
            } catch (err) {
              logProductionError(err, "BatchScreen.DeleteBatch." + id);
              Alert.alert("Error", "Failed to delete batch. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedBatchId(prev => prev === id ? null : id);
  }, []);

  // Memoized RenderItem for batch cards
  const renderItem = useCallback(({ item: batch }) => {
    const isExpanded = expandedBatchId === batch.id;
    const daysArr = ["day0", "day1", "day2", "day3", "day4", "day5", "day6"];

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.batchCard}>
          <View style={styles.batchHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchName}>{batch.name}</Text>
              <Text style={styles.batchDate}>
                <Text style={{ fontWeight: '700' }}>Batch Created on: </Text>
                {batch.createdAt ? new Date(parseInt(batch.createdAt)).toLocaleDateString() : 'Unknown date'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Prominent View Dashboard Button */}
          <TouchableOpacity 
            style={[styles.dashboardBtn, isExpanded && styles.dashboardBtnActive]}
            onPress={() => toggleExpand(batch.id)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isExpanded ? "podium" : "podium-outline"} 
              size={20} 
              color={isExpanded ? "#fff" : colors.primary} 
            />
            <Text style={[styles.dashboardBtnText, isExpanded && { color: "#fff" }]}>
              {isExpanded ? "Hide Dashboard" : "View Analytics Dashboard"}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={isExpanded ? "#fff" : colors.primary} 
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>


          {isExpanded && (
            <View style={styles.analysisSection}>
              {daysArr.map((dayKey, index) => (
                <DailyGraph 
                  key={dayKey} 
                  dayKey={dayKey} 
                  dayData={batch[dayKey]} 
                  index={index}
                  colors={colors}
                />
              ))}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.imagesBtn]}
              onPress={() => exportImagesPDFOptimized()}
            >
              <Ionicons name="image-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Images</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.pdfBtn]}
              onPress={() => exportPDF(batch)}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => deleteBatch(batch.id, batch.name)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [expandedBatchId, toggleExpand, deleteBatch, colors]);

  if (loading) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors?.primary} />
          <Text style={[styles.loadingText, { color: colors?.subtext }]}>
            Loading batches...
          </Text>
        </SafeAreaView>
      </Background>
    );
  }

  if (error) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <Ionicons name="warning-outline" size={64} color={colors?.subtext} />
          <Text style={[styles.errorTitle, { color: colors?.text }]}>
            Error Loading Batches
          </Text>
          <Text style={[styles.errorText, { color: colors?.subtext }]}>
            {error}
          </Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background variant="gradient">
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <FlatList
          data={sortedBatches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={64} color={colors?.subtext} />
              <Text style={[styles.emptyTitle, { color: colors?.text }]}>
                No Batches Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors?.subtext }]}>
                Add a new batch to start tracking fermentation.
              </Text>
            </Card>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: {
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  batchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 6,
    borderTopColor: "#8B5A2B",
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 90, 43, 0.06)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 43, 0.1)',
  },
  dashboardBtnActive: {
    backgroundColor: '#8B5A2B',
  },
  dashboardBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5A2B',
  },
  analysisSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(139, 90, 43, 0.15)",
    marginBottom: 20,
  },
  dayCard: {
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeaderGradient: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  noDataPlaceholder: {
    alignItems: 'center',
    justifyContent: "center",
    paddingVertical: 30,
    backgroundColor: '#FAFAFA',
  },
  chartWrapper: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  batchName: { fontSize: 18, fontWeight: "700", color: "#4B3B2B" },
  batchDate: { fontSize: 13, color: "#8B7355" },
  infoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B3A29",
    marginVertical: 2,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
  },
  imagesBtn: { backgroundColor: "#2E7D32" },
  pdfBtn: { backgroundColor: "#8B4513" },
  csvBtn: { backgroundColor: "#A0522D" },
  deleteBtn: { backgroundColor: "#B22222" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyCard: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});