import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

export default function SettingsScreen({ navigation }) {
  const { isDark, setIsDark, colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Settings
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.row}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={20}
            color={colors.text}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={setIsDark}
            thumbColor={isDark ? colors.primary : "#ccc"}
            trackColor={{ false: "#cfcfcf", true: colors.border }}
          />
        </View>
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
  title: { fontSize: 20, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  icon: { marginRight: 8 },
  text: { fontSize: 16, flex: 1 },
});