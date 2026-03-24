import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppTheme } from '../context/ThemeContext';

export default function Card({ style, children }) {
  const { colors } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.pad,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
});
