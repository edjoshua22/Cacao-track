import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function Stat({ label, value }) {
  return (
    <View style={styles.miniCard}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  miniCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: theme.colors.card, // Adjust if you want light/dark theme support
    elevation: 2, // for Android shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  label: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },
});
