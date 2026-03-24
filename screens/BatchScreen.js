import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

const DAY_MS = 24 * 60 * 60 * 1000;

export default function BatchScreen() {
  const db = getDatabase(app);
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize batch processing to prevent unnecessary re-renders
  const processBatchData = useCallback((batchData, batchId) => {
    try {
      return {
        id: batchId,
        ...batchData,
        relevantData: [], // Skip heavy processing for initial load
      };
    } catch (error) {
      logProductionError(error, 'BatchScreen.ProcessBatchData');
      return {
        id: batchId,
        ...batchData,
        relevantData: [],
      };
    }
  }, []);

  // Memoized sorted batches to prevent unnecessary re-renders
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => (parseInt(b.createdAt) || 0) - (parseInt(a.createdAt) || 0));
  }, [batches]);

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const batchesRef = ref(db, "batches/" + userId);
        
        // Also check if batches are stored directly under 'batches' (without userId)
        const globalBatchesRef = ref(db, 'batches');

        unsubscribe = onValue(
          batchesRef,
          (snapshot) => {
            try {
              let allBatches = [];
              
              if (snapshot.exists()) {
                const data = snapshot.val();
                
                if (data != null) {
                  // Process user-specific batches
                  const userBatches = Object.entries(data).map(([id, batch]) => 
                    processBatchData(batch, id)
                  );
                  allBatches = [...allBatches, ...userBatches];
                }
              }
              
              // Also check global batches for legacy data
              const globalUnsubscribe = onValue(globalBatchesRef, (globalSnapshot) => {
                
                if (globalSnapshot.exists()) {
                  const globalData = globalSnapshot.val();
                  
                  if (globalData != null) {
                    // Process global batches
                    const globalBatches = Object.entries(globalData).map(([id, batch]) => {
                      return processBatchData(batch, id);
                    });
                    
                    // Combine user and global batches, remove duplicates by ID
                    const combinedBatches = [...allBatches, ...globalBatches];
                    const uniqueBatches = combinedBatches.filter((batch, index, self) => 
                      index === self.findIndex((b) => b.id === batch.id)
                    );
                    
                    setBatches(uniqueBatches);
                    setError(null);
                  } else {
                    // Only user batches exist
                    setBatches(allBatches);
                    setError(null);
                  }
                } else {
                  // Only user batches exist
                  setBatches(allBatches);
                  setError(null);
                }
              });
              
              // Don't clear batches if snapshot doesn't exist - keep existing data
            } catch (error) {
              logProductionError(error, 'BatchScreen.FirebaseListener');
              setError('Failed to process batch data');
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            logProductionError(error, 'BatchScreen.FirebaseError');
            setError('Failed to load batches');
            setLoading(false);
          }
        );
      } catch (error) {
        logProductionError(error, 'BatchScreen.Setup');
        setError('Failed to setup batch listener');
        setLoading(false);
      }
    };
    
    setupListener();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          logProductionError(error, 'BatchScreen.Cleanup');
        }
      }
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
  }, [db]);

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
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
          {sortedBatches.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={64} color={colors?.subtext} />
              <Text style={[styles.emptyTitle, { color: colors?.text }]}>
                No Batches Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors?.subtext }]}>
                Add a new batch to start tracking fermentation.
              </Text>
            </Card>
          ) : (
            sortedBatches.map((batch) => (
              <View key={batch.id} style={styles.cardWrapper}>
                <View style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.batchName}>{batch.name}</Text>
                      <Text style={styles.batchDate}>
                        {batch.createdAt ? new Date(parseInt(batch.createdAt)).toLocaleDateString() : 'Unknown date'}
                      </Text>
                    </View>
                  </View>

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
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#5B3A29",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  batchCard: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#8B5A2B",
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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