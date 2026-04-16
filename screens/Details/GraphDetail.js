import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../../theme";
import LineChart from "../../components/LineChart";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../firebaseConfig";

export default function GraphDetail() {
  const [tempDHT1Data, setTempDHT1Data] = useState([]);
  const [tempDHT2Data, setTempDHT2Data] = useState([]);
  const [humidDHT1Data, setHumidDHT1Data] = useState([]);
  const [humidDHT2Data, setHumidDHT2Data] = useState([]);
  const [moistureData, setMoistureData] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const db = getDatabase(app);
    const sensorRef = ref(db, "sensorData");

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const keys = Object.keys(data).slice(-20); // last 20 readings

        const tempDHT1 = [];
        const tempDHT2 = [];
        const humidDHT1 = [];
        const humidDHT2 = [];
        const moistures = [];
        const lbls = [];

        keys.forEach((key, idx) => {
          const entry = data[key];
          // Support both new format (tempDHT1, tempDHT2) and old format (temperature)
          tempDHT1.push(entry.tempDHT1 ?? entry.temp1 ?? entry.temperature ?? 0);
          tempDHT2.push(entry.tempDHT2 ?? entry.temp2 ?? entry.temperature ?? 0);
          humidDHT1.push(entry.humidDHT1 ?? entry.humidity1 ?? entry.humidity ?? 0);
          humidDHT2.push(entry.humidDHT2 ?? entry.humidity2 ?? entry.humidity ?? 0);
          moistures.push(entry.soilMoisture ?? entry.moisture ?? 0);
          lbls.push(`${idx}`);
        });

        setTempDHT1Data(tempDHT1);
        setTempDHT2Data(tempDHT2);
        setHumidDHT1Data(humidDHT1);
        setHumidDHT2Data(humidDHT2);
        setMoistureData(moistures);
        setLabels(lbls);
      }
      // Don't clear chart data if snapshot doesn't exist - keep existing data
    });

    
    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Graph Detail</Text>
      <Text style={styles.subtitle}>Last 20 Sensor Readings - Dual DHT22 Sensors</Text>

      <LineChart
        labels={labels}
        tempDHT1Data={tempDHT1Data}
        tempDHT2Data={tempDHT2Data}
        humidDHT1Data={humidDHT1Data}
        humidDHT2Data={humidDHT2Data}
        moistureData={moistureData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
    color: theme.colors.text,
  },
});
