/**
 * @file App.js  (src/app/App.js)
 * @description New application root.
 * Bootstraps the DI container and AuthService BEFORE rendering any UI.
 * All navigation is handled by RootNavigator.
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { ThemeProvider }          from '../../context/ThemeContext';
import RootNavigator              from './navigation/RootNavigator';
import container                  from '../core/di/container';
import { logEnvironmentInfo, logCriticalError } from '../core/utils/debugUtils';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        logEnvironmentInfo();

        // Warm up the auth service singleton so user is ready before first screen renders
        const authService = container.resolve('authService');
        await authService.initialize();

        if (__DEV__) console.log('✅ DI Container bootstrapped');
      } catch (error) {
        logCriticalError(error, 'App.bootstrap');
      } finally {
        setIsReady(true);
      }
    };
    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.splash}>
            <ActivityIndicator size="large" color="#8B5A2B"/>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator/>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' },
});
