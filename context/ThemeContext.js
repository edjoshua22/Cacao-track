// context/ThemeContext.js
import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Default: light mode

  const lightTheme = {
    // ── Brand ───────────────────────────────────────────────────────────────
    primary:       "#C4772A",   // Warm amber-cacao
    primaryLight:  "#E8A44A",   // Highlight
    primaryDark:   "#8B5A2B",   // Pressed state
    accent:        "#22C55E",   // Green — good status
    danger:        "#EF4444",   // Red alert
    warning:       "#F59E0B",   // Amber warning

    // ── Surfaces ─────────────────────────────────────────────────────────────
    background:    "#F5F0EA",
    surface:       "#FFFFFF",
    card:          "#FFFFFF",
    cardElevated:  "#FAF7F4",
    border:        "rgba(139,90,43,0.15)",
    borderLight:   "rgba(139,90,43,0.08)",

    // ── Text ─────────────────────────────────────────────────────────────────
    text:          "#1A1008",
    textSecondary: "#5B4A3D",
    subtext:       "#8B7355",
    placeholder:   "#B8A99A",

    // ── Tab bar ──────────────────────────────────────────────────────────────
    tabBar:        "#FFFFFF",
    tabBorder:     "rgba(139,90,43,0.12)",

    // ── Gradients (as arrays for LinearGradient) ──────────────────────────────
    heroGradient:       ["#C4772A", "#E8A44A"],
    cardGradient:       ["#FFFFFF", "#FAF7F4"],
    backgroundGradient: ["#F5F0EA", "#EDE3D4"],
  };

  const darkTheme = {
    // ── Brand ───────────────────────────────────────────────────────────────
    primary:       "#E8A44A",   // Glowing amber
    primaryLight:  "#F5C878",   // Highlight
    primaryDark:   "#C4772A",   // Pressed state
    accent:        "#34D399",   // Emerald green
    danger:        "#F87171",   // Soft red
    warning:       "#FBBF24",   // Amber

    // ── Surfaces ─────────────────────────────────────────────────────────────
    background:    "#0D0A07",   // Near-black warm dark
    surface:       "#161209",
    card:          "#1E1812",   // Rich dark card
    cardElevated:  "#26201A",
    border:        "rgba(232,164,74,0.15)",
    borderLight:   "rgba(232,164,74,0.08)",

    // ── Text ─────────────────────────────────────────────────────────────────
    text:          "#F5E9DD",
    textSecondary: "#C4B7A9",
    subtext:       "#8B7B6B",
    placeholder:   "#5B4A3D",

    // ── Tab bar ──────────────────────────────────────────────────────────────
    tabBar:        "#1E1812",
    tabBorder:     "rgba(232,164,74,0.12)",

    // ── Gradients ──────────────────────────────────────────────────────────
    heroGradient:       ["#C4772A", "#8B5A2B"],
    cardGradient:       ["#1E1812", "#26201A"],
    backgroundGradient: ["#0D0A07", "#1A1208"],
  };

  const colors = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
