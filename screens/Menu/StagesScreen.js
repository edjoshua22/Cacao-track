import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

export default function StagesScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();

  const stages = [
    {
      title: "Anaerobic Phase (Yeast Fermentation)",
      description:
        "Yeasts break down the sugars in the pulp into alcohol under low oxygen conditions. Lasts for 24–48 hours.",
      icon: "water-outline",
    },
    {
      title: "Lactic Acid Fermentation",
      description:
        "Lactic acid bacteria produce lactic acid that helps break down the pulp. Overlaps with yeast activity.",
      icon: "medkit-outline",
    },
    {
      title: "Acetic Acid Fermentation",
      description:
        "Acetic acid bacteria oxidize ethanol into acetic acid, producing heat that kills embryos and develops flavor.",
      icon: "flame-outline",
    },
    {
      title: "Aerobic Phase (Turning)",
      description:
        "Farmers turn the beans to increase oxygen exposure, helping acetic acid bacteria thrive and ensuring even fermentation.",
      icon: "leaf-outline",
    },
    {
      title: "Drying Phase",
      description:
        "Beans are dried under the sun or mechanical dryers to reduce moisture to 7%, preserving flavor and preventing mold.",
      icon: "sunny-outline",
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
              name="leaf-outline"
              size={24}
              color={colors.text}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Fermentation Stages
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} /> 
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {stages.map((stage, index) => (
            <View key={index} style={styles.stageBlock}>
              <Ionicons
                name={stage.icon}
                size={28}
                color={colors.text}
                style={styles.stageIcon}
              />
              <View style={styles.stageContent}>
                <Text style={[styles.stageTitle, { color: colors.text }]}>
                  {stage.title}
                </Text>
                <Text style={[styles.stageText, { color: colors.text }]}>
                  {stage.description}
                </Text>
              </View>
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
  stageBlock: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stageIcon: { marginRight: 12, marginTop: 4 },
  stageContent: { flex: 1 },
  stageTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  stageText: { fontSize: 14, lineHeight: 20 },
});