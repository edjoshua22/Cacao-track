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

export default function FunctionsScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();

  const functions = [
    { title: "Real-time sensor monitoring", icon: "analytics-outline", description: "Tracks temperature, humidity, and moisture levels during fermentation." },
    { title: "Automated image capture", icon: "camera-outline", description: "Captures periodic images of fermenting beans to detect visual changes such as color variation." },
    { title: "ML-powered visual analysis", icon: "sparkles-outline", description: "Uses machine learning to analyze images and help identify fermentation stages and anomalies." },
    { title: "Mobile dashboard", icon: "phone-portrait-outline", description: "Displays sensor data, fermentation status, graphs, and an image timeline through an intuitive interface." },
    { title: "Automated data logging", icon: "document-text-outline", description: "Records sensor readings and images for review and quality control." },
    { title: "System alerts", icon: "alert-circle-outline", description: "Notifies users when conditions deviate from ideal fermentation ranges." },
    { title: "Data export", icon: "download-outline", description: "Allows users to generate records for documentation and traceability." },
  ];

  const hardware = [
    "IoT sensors — DHT22 to measure temperature, humidity, and moisture.",
    "Microcontroller — ESP32 for data collection and wireless communication.",
    "Camera module — ESP32-CAM for image capture.",
    "LED light — Compact LED for low-light image clarity.",
    "Fermentation box — Custom container with integrated sensors and cam.",
    "Power supply — Rechargeable battery or direct power source.",
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="list-circle-outline"
              size={24}
              color={colors.text}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Functions
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
          {functions.map((f, i) => (
            <View key={i} style={styles.functionBlock}>
              <Ionicons
                name={f.icon}
                size={28}
                color={colors.text}
                style={styles.functionIcon}
              />
              <View style={styles.functionContent}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {f.title}
                </Text>
                <Text style={[styles.sectionText, { color: colors.text }]}>
                  {f.description}
                </Text>
              </View>
            </View>
          ))}

          {/* Hardware Section */}
          <Text
            style={[
              styles.hardwareTitle,
              { color: colors.text },
            ]}
          >
            Hardware Requirements
          </Text>
          {hardware.map((h, i) => (
            <View key={i} style={styles.hardwareItem}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={colors.text}
                style={styles.hardwareIcon}
              />
              <Text style={[styles.sectionText, { color: colors.text, flex: 1 }]}>
                {h}
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
  functionBlock: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  functionIcon: { marginRight: 12, marginTop: 4 },
  functionContent: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionText: { fontSize: 14, lineHeight: 20 },
  hardwareTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  hardwareItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  hardwareIcon: { marginRight: 8, marginTop: 2 },
});