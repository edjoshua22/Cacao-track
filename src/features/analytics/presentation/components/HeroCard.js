import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const HeroCard = React.memo(({ stats, isDark, dayGroupsLength, totalReadings }) => {
  if (!stats) return null;

  return (
    <LinearGradient
      colors={isDark ? ["#C4772A", "#8B5A2B"] : ["#E8A44A", "#C4772A"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={S.hero}
    >
      <View style={S.deco1} /><View style={S.deco2} />
      <View style={S.heroRow}>
        <View>
          <Text style={S.heroTemp}>{stats.tempAvg.toFixed(1)}°C</Text>
          <Text style={S.heroLbl}>Average Temperature</Text>
        </View>
        <Ionicons name="analytics" size={44} color="rgba(255,255,255,0.3)" />
      </View>
      <View style={S.heroMetrics}>
        {[
          { v: stats.humidAvg.toFixed(1) + "%", l: "Avg Humidity" },
          { v: stats.moistAvg.toFixed(1) + "%", l: "Avg Moisture" },
          { v: String(dayGroupsLength) + " days",  l: "Calendar Days" },
          { v: String(totalReadings),               l: "Total Readings" },
        ].map((m, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={S.heroSep} />}
            <View style={S.heroItem}>
              <Text style={S.heroVal}>{m.v}</Text>
              <Text style={S.heroItemLbl}>{m.l}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </LinearGradient>
  );
});

const S = StyleSheet.create({
  hero:  { borderRadius: 24, padding: 22, marginBottom: 20, overflow: "hidden", position: "relative", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  deco1: { position: "absolute", width: 120, height: 120, borderRadius: 60, top: -30, right: -30, backgroundColor: "rgba(255,255,255,0.10)" },
  deco2: { position: "absolute", width: 80,  height: 80,  borderRadius: 40, bottom: 14, left: -20, backgroundColor: "rgba(255,255,255,0.07)" },
  heroRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, zIndex: 1 },
  heroTemp:    { fontSize: 46, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  heroLbl:     { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  heroMetrics: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", zIndex: 1 },
  heroItem:    { alignItems: "center", flex: 1 },
  heroVal:     { fontSize: 15, fontWeight: "800", color: "#fff" },
  heroItemLbl: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 3, textAlign: "center" },
  heroSep:     { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },
});
