import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from './AnalyticsComponents';

export const LatestReadingCard = React.memo(({ latest, colors }) => {
  if (!latest) return null;

  return (
    <>
      <SectionHeader 
        emoji="⚡" 
        title="Latest Reading" 
        subtitle={latest.timeLabel ? String(latest.timeLabel) : ""} 
        color="#10B981" 
        colors={colors} 
      />
      <View style={S.latestRow}>
        {[
          { lbl: "DHT1 Temp",  val: latest.tempDHT1, unit: "°C", color: "#EF4444", icon: "thermometer" },
          { lbl: "DHT2 Temp",  val: latest.tempDHT2, unit: "°C", color: "#F87171", icon: "thermometer-outline" },
          { lbl: "Humidity",   val: latest.humidDHT1, unit: "%",  color: "#3B82F6", icon: "water" },
          { lbl: "Moisture",   val: latest.moisture,  unit: "%",  color: "#10B981", icon: "leaf" },
        ].map((it, i) => (
          <View key={i} style={[S.statTile, { backgroundColor: colors.card, borderColor: it.color + "40" }]}>
            <View style={[S.statIcon, { backgroundColor: it.color + "18" }]}>
              <Ionicons name={it.icon} size={16} color={it.color} />
            </View>
            <Text style={[S.statVal, { color: it.color }]}>{it.val.toFixed(1)}{it.unit}</Text>
            <Text style={[S.statLbl, { color: colors.subtext }]}>{it.lbl}</Text>
          </View>
        ))}
      </View>
    </>
  );
});

const S = StyleSheet.create({
  latestRow:  { flexDirection: "row", gap: 8, marginBottom: 20 },
  statTile:   { flex: 1, alignItems: "center", padding: 10, borderRadius: 14, borderWidth: 1, elevation: 2 },
  statIcon:   { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  statVal:    { fontSize: 14, fontWeight: "900", letterSpacing: -0.5 },
  statLbl:    { fontSize: 9,  fontWeight: "600", marginTop: 2, textAlign: "center" },
});
