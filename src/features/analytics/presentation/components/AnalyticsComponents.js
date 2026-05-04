import React, { useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LineChart from "../../../../../components/LineChart";

const STAGE_META = [
  { name: "Day 0 — Fresh",                color: "#8B5A2B", emoji: "🌱" },
  { name: "Day 1 — Anaerobic",            color: "#7C3AED", emoji: "🫙" },
  { name: "Day 2 — Anaerobic/Alcoholic",  color: "#3B82F6", emoji: "⚗️" },
  { name: "Day 3 — Aerobic",              color: "#10B981", emoji: "☀️" },
  { name: "Day 4 — Aerobic",              color: "#059669", emoji: "☀️" },
  { name: "Day 5 — Maturation",           color: "#F59E0B", emoji: "⏳" },
  { name: "Day 6 — Drying Ready",         color: "#EF4444", emoji: "✅" },
];

// ── Stat pill ────────────────────────────────────────────────────────────────
export function StatPill({ icon, label, value, unit, color }) {
  return (
    <View style={[P.wrap, { backgroundColor: color + "18", borderColor: color + "40" }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[P.lbl, { color }]}>{label}</Text>
      <Text style={[P.val, { color }]}>{Number(value).toFixed(1)}{unit}</Text>
    </View>
  );
}
const P = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  lbl:  { fontSize: 10, fontWeight: "600" },
  val:  { fontSize: 11, fontWeight: "800" },
});

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ emoji, title, subtitle, color, colors }) {
  const c = color || colors.primary;
  return (
    <LinearGradient colors={[c + "20", c + "04"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={SHS.wrap}>
      <View style={[SHS.bar, { backgroundColor: c }]} />
      <View style={{ flex: 1 }}>
        <Text style={[SHS.title, { color: colors.text }]}>{emoji} {title}</Text>
        {subtitle ? <Text style={[SHS.sub, { color: colors.subtext }]}>{subtitle}</Text> : null}
      </View>
    </LinearGradient>
  );
}
const SHS = StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 14, marginTop: 6 },
  bar:   { width: 4, height: 36, borderRadius: 2 },
  title: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  sub:   { fontSize: 11, marginTop: 2 },
});

// ── Day card (per calendar date) ─────────────────────────────────────────────
export const DayCard = React.memo(({ index, dateStr, entries, series, stats, colors, isDark }) => {
  const meta = STAGE_META[Math.min(index, STAGE_META.length - 1)];
  const [expanded, setExpanded] = useState(index === 0);
  const [showChart, setShowChart] = useState(index === 0);
  const anim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    
    if (next) {
      // Defer the heavy chart rendering
      setTimeout(() => setShowChart(true), 150);
    } else {
      setShowChart(false);
    }

    Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: true, tension: 60, friction: 8 }).start();
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={[DC.card, { borderColor: meta.color + "55", backgroundColor: isDark ? "#161616" : "#fff" }]}>
      <View style={[DC.stripe, { backgroundColor: meta.color }]} />

      {/* Header */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle}>
        <LinearGradient
          colors={[meta.color + "28", meta.color + "06"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={DC.hdr}
        >
          <View style={[DC.badge, { backgroundColor: meta.color }]}>
            <Text style={DC.badgeNum}>{index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 15 }}>{meta.emoji}</Text>
              <Text style={[DC.name, { color: colors.text }]}>{meta.name}</Text>
            </View>
            <Text style={[DC.sub, { color: colors.subtext }]}>
              {dateStr}  ·  {entries.length} readings
            </Text>
          </View>
          <View style={[DC.chip, { backgroundColor: entries.length > 0 ? meta.color + "22" : (isDark ? "#2a2a2a" : "#f3f4f6") }]}>
            <View style={[DC.dot, { backgroundColor: entries.length > 0 ? meta.color : colors.subtext }]} />
            <Text style={[DC.chipTxt, { color: entries.length > 0 ? meta.color : colors.subtext }]}>
              {entries.length > 0 ? "Has data" : "Empty"}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate }], marginLeft: 6 }}>
            <Ionicons name="chevron-down" size={18} color={meta.color} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        series && !series.isEmpty ? (
          <View style={DC.body}>
            {/* Stat pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={DC.pills}>
              <StatPill icon="thermometer-outline" label="Avg Temp"  value={stats.tempAvg}  unit="°C" color="#EF4444" />
              <StatPill icon="thermometer"         label="Max Temp"  value={stats.tempMax}  unit="°C" color="#F87171" />
              <StatPill icon="water-outline"       label="Avg Humid" value={stats.humidAvg} unit="%"  color="#3B82F6" />
              <StatPill icon="water"               label="Max Humid" value={stats.humidMax} unit="%"  color="#60A5FA" />
              <StatPill icon="leaf-outline"        label="Avg Moist" value={stats.moistAvg} unit="%"  color="#10B981" />
            </ScrollView>

            {/* Chart */}
            <View style={[DC.chartWrap, { backgroundColor: isDark ? "#0f0f0f" : "#fafafa", minHeight: 250, justifyContent: 'center' }]}>
              {showChart ? (
                <LineChart
                  labels={series.labels}
                  tempDHT1Data={series.tempDHT1}
                  tempDHT2Data={series.tempDHT2}
                  humidDHT1Data={series.humidDHT1}
                  humidDHT2Data={series.humidDHT2}
                  moistureData={series.moisture}
                  hideHeader
                />
              ) : (
                <ActivityIndicator size="small" color={meta.color} style={{ marginVertical: 40 }} />
              )}
            </View>
          </View>
        ) : (
          <LinearGradient colors={[meta.color + "10", meta.color + "04"]} style={DC.empty}>
            <Ionicons name="stats-chart-outline" size={32} color={meta.color} style={{ opacity: 0.5 }} />
            <Text style={[DC.emptyTxt, { color: colors.subtext }]}>No sensor data for this day</Text>
          </LinearGradient>
        )
      )}
    </View>
  );
});

const DC = StyleSheet.create({
  card:     { borderRadius: 20, borderWidth: 1.5, marginBottom: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  stripe:   { height: 4 },
  hdr:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  badge:    { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  badgeNum: { color: "#fff", fontWeight: "900", fontSize: 16 },
  name:     { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  sub:      { fontSize: 11, marginTop: 2 },
  chip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  chipTxt:  { fontSize: 10, fontWeight: "700" },
  body:     { paddingBottom: 10 },
  pills:    { gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  chartWrap:{ borderRadius: 14, marginHorizontal: 10, marginBottom: 10, overflow: "hidden", padding: 4 },
  empty:    { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyTxt: { fontSize: 13, fontWeight: "500" },
});
