import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";
import { useAppTheme } from "../context/ThemeContext";

// 🟢 Ideal fermentation ranges
const IDEAL_TEMP_MIN = 45;
const IDEAL_TEMP_MAX = 50;
const IDEAL_HUM_MIN = 65;
const IDEAL_HUM_MAX = 80;

export default function Badge({ type = "temperature", value, humidity }) {
  const { isDark } = useAppTheme();
  let label = "Optimal";
  let tone = "success";

  // 🌡️ Temperature badge
  if (type === "temperature") {
    if (value < IDEAL_TEMP_MIN) {
      label = "Too Cold";
      tone = "warn";
    } else if (value > IDEAL_TEMP_MAX) {
      label = "Too Hot";
      tone = "warn";
    }
  }

  // 💧 Humidity badge
  if (type === "humidity") {
    if (value < IDEAL_HUM_MIN) {
      label = "Too Dry";
      tone = "warn";
    } else if (value > IDEAL_HUM_MAX) {
      label = "Too Humid";
      tone = "warn";
    }
  }

  // 📊 Overall fermentation badge
  if (type === "overall") {
    if (
      value >= IDEAL_TEMP_MIN &&
      value <= IDEAL_TEMP_MAX &&
      humidity >= IDEAL_HUM_MIN &&
      humidity <= IDEAL_HUM_MAX
    ) {
      label = "Optimal";
      tone = "success";
    } else {
      label = "Not Optimal";
      tone = "warn";
    }
  }

  const bg = tone === "success"
    ? (isDark ? "#1e3a28" : theme.colors.successBg)
    : (isDark ? "#3a2f12" : theme.colors.warnBg);
  const fg = tone === "success"
    ? (isDark ? "#9AE6B4" : theme.colors.successText)
    : (isDark ? "#F6E05E" : theme.colors.warnText);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "600", fontSize: 12 },
});
