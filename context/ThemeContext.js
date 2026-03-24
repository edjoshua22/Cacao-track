// context/ThemeContext.js
import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const lightTheme = {
    primary: "#8C6339", // Cacao Brown
    background: "#EADCCB",
    text: "#24160C",
    subtext: "#5B4A3D",
    card: "#FFFFFF",
    border: "#D8C5B2",
  };

  const darkTheme = {
    primary: "#3E2723", // Really Dark Brown
    background: "#1A1410",
    text: "#F5E9DD",
    subtext: "#C4B7A9",
    card: "#26201B",
    border: "#3A2F26",
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
