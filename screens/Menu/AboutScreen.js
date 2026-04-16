import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

export default function AboutScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();

  const infoBlocks = [
    {
      icon: "hardware-chip-outline",
      text:
        "CacaoTrack is an IoT-based fermentation monitoring system designed for smallholder cacao farmers in Davao City. It integrates sensors to measure temperature, humidity, and moisture, a camera with LED for image capture, and a microcontroller-controlled stirrer for automated mixing.",
    },
    {
      icon: "bar-chart-outline",
      text:
        "The system provides real-time data and visual analysis through a mobile dashboard, helping farmers track fermentation progress and improve bean quality. CacaoTrack aims to enhance consistency, reduce manual errors, and support data-driven decision-making in cacao fermentation.",
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="information-circle-outline"
              size={26}
              color={colors.text}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              About CacaoTrack
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {infoBlocks.map((block, index) => (
            <View key={index} style={styles.infoBlock}>
              <Ionicons
                name={block.icon}
                size={26}
                color={colors.text}
                style={styles.blockIcon}
              />
              <Text style={[styles.text, { color: colors.text }]}>
                {block.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerIcon: { marginRight: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  scrollContent: { paddingBottom: 30 },
  infoBlock: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  blockIcon: { marginRight: 12, marginTop: 4 },
  text: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
});