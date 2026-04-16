import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useAppTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const Background = ({ children, variant = 'gradient' }) => {
  const { isDark, colors } = useAppTheme();
  
  const renderBackground = () => {
    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[
              isDark ? colors.background : theme.colors.bg, 
              isDark ? colors.border : '#D8C5B2'
            ]}
            style={StyleSheet.absoluteFill}
          />
        );
      
      case 'waves':
        return (
          <LinearGradient
            colors={[
              isDark ? colors.background : theme.colors.bg, 
              isDark ? colors.border : theme.colors.border
            ]}
            style={StyleSheet.absoluteFill}
          />
        );
      
      case 'pods':
        return (
          <View style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: isDark ? colors.background : theme.colors.bg }
          ]} />
        );
      
      default:
        return <View style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: isDark ? colors.background : theme.colors.bg }
        ]} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default Background;