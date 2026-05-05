/**
 * GraphDetail.js
 * Displays a real-time line chart of the last 20 sensor readings.
 * Cleaned up: useReducer for chart state, single Firebase listener, shared styles.
 */
import React, { useEffect, useReducer } from 'react';
import { View, Text, ScrollView }        from 'react-native';
import { getDatabase, ref, onValue }     from 'firebase/database';
import { app }                           from '../../firebaseConfig.secure';
import { useAppTheme }                   from '../../context/ThemeContext';
import LineChart                         from '../../components/LineChart';
import { detailStyles as styles }        from './DetailStyles';

// ── Reducer ──────────────────────────────────────────────────────────────────
const INITIAL_CHART = {
  labels: [], tempDHT1: [], tempDHT2: [],
  humidDHT1: [], humidDHT2: [], moisture: [],
};

const chartReducer = (state, action) => {
  if (action.type === 'SET') return { ...state, ...action.payload };
  return state;
};

// ── Main component ────────────────────────────────────────────────────────────

/**
 * GraphDetail — live chart of the last 20 dual-DHT22 + soil sensor readings.
 */
const GraphDetail = () => {
  const { colors }           = useAppTheme();
  const [chart, dispatch]    = useReducer(chartReducer, INITIAL_CHART);

  useEffect(() => {
    const db          = getDatabase(app);
    const sensorRef   = ref(db, 'sensorData');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data  = snapshot.val();
      const keys  = Object.keys(data).slice(-20);
      const out   = { labels: [], tempDHT1: [], tempDHT2: [], humidDHT1: [], humidDHT2: [], moisture: [] };

      keys.forEach((key, idx) => {
        const e = data[key];
        out.labels.push(`${idx}`);
        out.tempDHT1.push(e.tempDHT1  ?? e.temp1       ?? e.temperature ?? 0);
        out.tempDHT2.push(e.tempDHT2  ?? e.temp2       ?? e.temperature ?? 0);
        out.humidDHT1.push(e.humidDHT1 ?? e.humidity1  ?? e.humidity    ?? 0);
        out.humidDHT2.push(e.humidDHT2 ?? e.humidity2  ?? e.humidity    ?? 0);
        out.moisture.push(e.soilMoisture ?? e.moisture  ?? 0);
      });

      dispatch({ type: 'SET', payload: out });
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.graphTitle,    { color: colors.text }]}>Graph Detail</Text>
      <Text style={[styles.graphSubtitle, { color: colors.text }]}>
        Last 20 Sensor Readings — Dual DHT22 Sensors
      </Text>

      <LineChart
        labels={chart.labels}
        tempDHT1Data={chart.tempDHT1}
        tempDHT2Data={chart.tempDHT2}
        humidDHT1Data={chart.humidDHT1}
        humidDHT2Data={chart.humidDHT2}
        moistureData={chart.moisture}
      />
    </ScrollView>
  );
};

export default GraphDetail;
