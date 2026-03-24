import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

export default function SoftwareScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();

  const software = [
    {
      title: "Framework",
      icon: "phone-portrait-outline",
      items: [
        "React Native — to build a cross-platform mobile app compatible with Android (and optionally iOS).",
      ],
    },
    {
      title: "Programming Languages",
      icon: "code-slash-outline",
      items: ["JavaScript / TypeScript — for mobile app development."],
    },
    {
      title: "UI Design Tools",
      icon: "color-palette-outline",
      items: ["Figma or Canva — to design and prototype the app interface."],
    },
    {
      title: "Database & Backend",
      icon: "server-outline",
      items: [
        "Firebase (Firestore / Realtime Database) — to store sensor data, images, and user data securely.",
      ],
    },
    {
      title: "Machine Learning Tools",
      icon: "sparkles-outline",
      items: [
        "Python (TensorFlow/PyTorch) - for training custom image classification models to detect cacao fermentation stages (day0-day6).",
        "Flask/FastAPI - to serve the trained model as a REST API endpoint for real-time inference from the mobile app.",
        "Custom Python API - integrated into the mobile app to perform real-time image classification using the trained model.",
      ],
    },
    {
      title: "Additional Tools",
      icon: "construct-outline",
      items: [
        "Arduino IDE  — to program and configure the microcontroller and sensors.",
        "VS Code — as the main code editor for both mobile app and backend scripts.",
      ],
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
              name="laptop-outline"
              size={26}
              color={colors.text}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Software Requirements
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} /> 
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.introText, { color: colors.text }]}>
            The software tools selected aim to balance affordability, scalability,
            and ease of use:
          </Text>

          {software.map((s, i) => (
            <View key={i} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={s.icon}
                  size={20}
                  color={colors.text}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {s.title}
                </Text>
              </View>
              {s.items.map((item, j) => (
                <View key={j} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                  <Text style={[styles.sectionText, { color: colors.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
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
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerIcon: { marginRight: 8 },
  title: { fontSize: 20, fontWeight: "700", flexShrink: 1 },
  scrollContent: { paddingBottom: 40 },
  introText: { fontSize: 15, marginBottom: 16, lineHeight: 22 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  sectionIcon: { marginRight: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  listItem: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  bullet: { fontSize: 16, marginRight: 6 },
  sectionText: { fontSize: 14, lineHeight: 20, flex: 1 },
});