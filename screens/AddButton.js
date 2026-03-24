import React, { useState } from "react";
import { 
  TouchableOpacity, 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { getDatabase, ref, push, set, get } from "firebase/database";
import { app } from "../firebaseConfig";
import { initializeAuth, getUserId } from "../utils/authUtils";
import { inferImage, stageMapping } from "../utils/inferImage";

// Arduino history key -> JS Date, e.g. "2025-01-01_12-30-00"
const parseHistoryKey = (key) => {
  try {
    const [datePart, timePart] = key.split("_");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split("-").map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  } catch (e) {
    // Failed to parse history key
    return null;
  }
};

export default function AddButton({ onBatchCreated }) {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const createBatch = async () => {
    if (!batchName.trim()) {
      Alert.alert("Error", "Please enter a batch name");
      return;
    }

    setCreating(true);
    
    try {
      await initializeAuth();
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const db = getDatabase(app);
      const batchesRef = ref(db, `batches/${userId}`);
      const capturesRef = ref(db, `captures/${userId}`);
      const newBatchRef = push(batchesRef);
      const batchStartTime = Date.now();
      
      // Fetch and organize data by fermentation stages
      // Read from Arduino history: /history/<YYYY-MM-DD_HH-MM-SS>/{dht1,dht2,average,soil,time}
      const [historySnapshot, capturesSnapshot] = await Promise.all([
        get(ref(db, "history")),
        get(capturesRef),
      ]);

      // Organize sensor data by stages (day0-day6)
      const stagesData = {
        day0: { sensorData: [], images: [], stageName: "Fresh" },
        day1: { sensorData: [], images: [], stageName: "Anaerobic" },
        day2: { sensorData: [], images: [], stageName: "Anaerobic / Alcoholic" },
        day3: { sensorData: [], images: [], stageName: "Aerobic" },
        day4: { sensorData: [], images: [], stageName: "Aerobic" },
        day5: { sensorData: [], images: [], stageName: "Maturation" },
        day6: { sensorData: [], images: [], stageName: "Drying Ready" }
      };

      // Process sensor data from /history:
      // - Include ALL readings from batch start time onwards (day0)
      // - Optionally include up to 7 days before for context (day1–day6)
      if (historySnapshot.exists()) {
        const history = historySnapshot.val();
        const allReadings = []; // Store all readings for this batch

        Object.entries(history).forEach(([key, entry]) => {
          const date = parseHistoryKey(key);
          if (!date) return;
          const entryTime = date.getTime();

          // Main reading uses AVERAGE values written by Arduino
          const temperature = parseFloat(entry.average?.temperature ?? 0) || 0;
          const humidity =
            parseFloat(entry.average?.humidity ?? entry.humidity ?? 0) || 0;
          const moisture = parseFloat(entry.soil ?? 0) || 0;

          // Build unified reading object
          const reading = {
            timestamp: entryTime,
            temperature,
            humidity,
            moisture,
            time: entry.time || key,
          };

          // Include ALL data from batch start time onwards (day0)
          if (entryTime >= batchStartTime) {
            stagesData.day0.sensorData.push(reading);
            allReadings.push(reading);
          } else if (
            entryTime >= batchStartTime - 7 * 24 * 60 * 60 * 1000
          ) {
            // Include data from up to 7 days before batch start for context
            const daysBeforeStart = Math.floor(
              (batchStartTime - entryTime) / (24 * 60 * 60 * 1000)
            );
            const dayKey = `day${Math.min(6, Math.max(1, daysBeforeStart))}`; // map 0+ → day1..day6

            if (stagesData[dayKey]) {
              stagesData[dayKey].sensorData.push(reading);
            }
          }
        });
        
        // Store all readings for easy access
        stagesData.allReadings = allReadings.sort((a, b) => a.timestamp - b.timestamp);
      }

      // Process images - classify and organize by stage
      // Include ALL images from batch start time onwards
      if (capturesSnapshot.exists()) {
        const captures = capturesSnapshot.val();
        const allImages = [];
        
        const imagePromises = Object.entries(captures).map(async ([timestamp, url]) => {
          const imgTimestamp = parseInt(timestamp) || 0;
          // Only process images from batch start time onwards
          if (imgTimestamp >= batchStartTime) {
            const stage = await inferImage(url);
            const dayKey = Object.keys(stageMapping).find(key => stageMapping[key] === stage) || 'day0';
            return { timestamp, url, stage, dayKey, imgTimestamp };
          }
          return null;
        });
        
        const classifiedImages = (await Promise.all(imagePromises)).filter(img => img !== null);
        
        classifiedImages.forEach(({ timestamp, url, stage, dayKey }) => {
          const imageData = { timestamp, url, stage };
          if (stagesData[dayKey]) {
            stagesData[dayKey].images.push(imageData);
          }
          allImages.push(imageData);
        });
        
        // Store all images for easy access
        stagesData.allImages = allImages.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
      }

      // Calculate averages from ALL readings from batch start time onwards
      // Use allReadings if available, otherwise calculate from all stages
      let totalTemp = 0, totalHumidity = 0, totalMoisture = 0, totalDataPoints = 0;
      
      if (stagesData.allReadings && stagesData.allReadings.length > 0) {
        // Use allReadings (most accurate - only readings from batch start onwards)
        stagesData.allReadings.forEach(entry => {
          totalTemp += entry.temperature;
          totalHumidity += entry.humidity;
          totalMoisture += entry.moisture;
          totalDataPoints++;
        });
      } else {
        // Fallback: calculate from all stages
        Object.values(stagesData).forEach(stage => {
          if (Array.isArray(stage.sensorData)) {
            stage.sensorData.forEach(entry => {
              totalTemp += entry.temperature;
              totalHumidity += entry.humidity;
              totalMoisture += entry.moisture;
              totalDataPoints++;
            });
          }
        });
      }

      const batchData = {
        name: batchName.trim(),
        notes: batchNotes.trim(),
        createdAt: batchStartTime, // Store as timestamp number
        status: "Active",
        quality: "Pending",
        avgTemp: totalDataPoints > 0 ? totalTemp / totalDataPoints : 0,
        avgHumidity: totalDataPoints > 0 ? totalHumidity / totalDataPoints : 0,
        avgMoisture: totalDataPoints > 0 ? totalMoisture / totalDataPoints : 0,
        dataPoints: totalDataPoints,
        startDate: new Date(batchStartTime).toISOString(),
        stagesData: stagesData, // Store organized data by stages
      };

      await set(newBatchRef, batchData);

      Alert.alert(
        "Success", 
        `Batch "${batchName}" created successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              setBatchName("");
              setBatchNotes("");
              if (onBatchCreated) {
                onBatchCreated(batchData);
              }
            }
          }
        ]
      );
    } catch (error) {
      // Error creating batch
      Alert.alert("Error", "Failed to create batch. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Batch Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Create New Batch
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Batch Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="e.g., Batch 5"
                    placeholderTextColor={colors.subtext}
                    value={batchName}
                    onChangeText={setBatchName}
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Notes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Add notes about this batch..."
                    placeholderTextColor={colors.subtext}
                    value={batchNotes}
                    onChangeText={setBatchNotes}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      { backgroundColor: colors.bg },
                    ]}
                    onPress={() => setModalVisible(false)}
                    disabled={creating}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.subtext }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.primary },
                      creating && styles.disabledButton,
                    ]}
                    onPress={createBatch}
                    disabled={creating}
                  >
                    {creating ? (
                      <Text style={styles.submitButtonText}>Creating...</Text>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>Create Batch</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});