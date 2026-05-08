/**
 * App.js — Root entry point with premium animated floating tab bar.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, LogBox, Platform,
  Animated, Easing,
} from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeProvider, useAppTheme } from './context/ThemeContext';

// ── Screens ───────────────────────────────────────────────────────────────────
import MonitoringScreen from './screens/MonitoringScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import TimelineScreen from './screens/TimelineScreen';
import NotificationScreen from './screens/NotificationScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import StirrerControlScreen from './screens/StirrerControlScreen';
import BatchDetail from './screens/Details/BatchDetail';
import GraphDetail from './screens/Details/GraphDetail';
import ImageDetail from './screens/Details/ImageDetail';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate`',
]);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'Monitoring', icon: 'home', label: 'Home' },
  { name: 'Timeline', icon: 'images', label: 'Timeline' },
  { name: 'Stirrer', icon: 'cog', label: 'Stirrer', isFab: true },
  { name: 'Analytics', icon: 'analytics', label: 'Analytics' },
  { name: 'Notifications', icon: 'notifications', label: 'Alerts' },
];

// ── Animated Tab Icon (memoized) ──────────────────────────────────────────────
const AnimatedTabIcon = React.memo(({ tab, focused, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const labelAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      // Single spring bounce — lightweight, no sequence needed
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      });
      Animated.timing(labelAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(1);
      Animated.timing(labelAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    }
  }, [focused]);

  return (
    <Animated.View style={tabStyles.tabIconContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[
          tabStyles.iconWrap,
          focused && {
            backgroundColor: colors.primary + '20',
            borderColor: colors.primary + '30',
            borderWidth: 1.5,
          },
        ]}>
          <Ionicons
            name={focused ? tab.icon : `${tab.icon}-outline`}
            size={focused ? 23 : 21}
            color={focused ? colors.primary : colors.subtext}
          />
        </View>
      </Animated.View>

      {/* Label fades in when focused */}
      <Animated.Text style={[
        tabStyles.label,
        { color: colors.primary, fontWeight: '700', opacity: labelAnim },
      ]}>
        {tab.label}
      </Animated.Text>

    </Animated.View>
  );
});

// ── Animated FAB Button (memoized) ────────────────────────────────────────────
const AnimatedFab = React.memo(({ colors, onPress }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  // Single lightweight opacity pulse — no scale, just opacity breathing
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop(); // cleanup on unmount
  }, []);

  const handlePress = useCallback(() => {
    // Quick cog spin + scale bounce
    spinAnim.setValue(0);
    Animated.parallel([
      Animated.timing(spinAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }),
      ]),
    ]).start();
    onPress();
  }, [onPress]);

  const cogRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={tabStyles.fabContainer}>
      {/* Subtle pulsing ring — opacity only, no transform */}
      <Animated.View style={[
        tabStyles.fabGlowRing,
        { borderColor: colors.primary, opacity: pulseAnim },
      ]} />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#8B5A2B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tabStyles.fabGradient}
          >
            <View style={tabStyles.fabInnerRing}>
              <Animated.View style={{ transform: [{ rotate: cogRotation }] }}>
                <Ionicons name="cog" size={28} color="#fff" />
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ── Premium Custom Tab Bar ────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation, onStirrerPress }) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      tabStyles.outerWrap,
      { paddingBottom: insets.bottom },
    ]}>
      <View style={[
        tabStyles.wrapper,
        {
          backgroundColor: isDark ? colors.tabBar + 'F5' : colors.tabBar + 'F8',
          borderColor: colors.border,
        },
      ]}>
        <View style={tabStyles.row}>
          {state.routes.map((route, index) => {
            const tab = TABS[index];
            const focused = state.index === index;

            // ── Center FAB (Stirrer) ────────────────────────────────────────
            if (tab.isFab) {
              return (
                <View key="stirrer-fab" style={tabStyles.tab}>
                  <AnimatedFab colors={colors} onPress={onStirrerPress} />
                </View>
              );
            }

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={tabStyles.tab}
              >
                <AnimatedTabIcon tab={tab} focused={focused} colors={colors} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  outerWrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  wrapper: {
    borderRadius: 20,
    marginBottom: 6,
    borderWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 1,
  },


  // ── FAB ──────────────────────────────────────────────────────────────────
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    width: 70,
    height: 70,
  },
  fabGlowRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabInnerRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
// Placeholder screen for the Stirrer tab (never actually shown — FAB opens modal instead)
function StirrerPlaceholder() {
  return <View style={{ flex: 1 }} />;
}

function MainTabs() {
  const [stirrerVisible, setStirrerVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        tabBar={props => (
          <CustomTabBar {...props} onStirrerPress={() => setStirrerVisible(true)} />
        )}
        screenOptions={{ headerShown: false }}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={
              tab.name === 'Monitoring' ? MonitoringScreen :
                tab.name === 'Timeline' ? TimelineScreen :
                  tab.name === 'Stirrer' ? StirrerPlaceholder :
                    tab.name === 'Analytics' ? AnalyticsScreen :
                      NotificationScreen
            }
            listeners={tab.isFab ? {
              tabPress: e => { e.preventDefault(); setStirrerVisible(true); },
            } : undefined}
          />
        ))}
      </Tab.Navigator>

      <StirrerControlScreen
        visible={stirrerVisible}
        onClose={() => setStirrerVisible(false)}
      />
    </>
  );
}

// ── Root Stack ────────────────────────────────────────────────────────────────
function RootStack({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="BatchDetail" component={BatchDetail} />
      <Stack.Screen name="GraphDetail" component={GraphDetail} />
      <Stack.Screen name="ImageDetail" component={ImageDetail} />
    </Stack.Navigator>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const [initialRoute, setInitialRoute] = useState(null);
  const { colors, isDark } = useAppTheme();
  const [fontsLoaded] = useFonts({
    Billabong: require('./assets/fonts/Billabong.otf'),
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      // DEV: reset onboarding each launch for testing. Remove __DEV__ block before shipping.
      if (__DEV__) {
        await AsyncStorage.removeItem('onboardingComplete').catch(() => { });
      }
      const value = await AsyncStorage.getItem('onboardingComplete').catch(() => null);
      setInitialRoute(value === 'true' ? 'MainTabs' : 'Onboarding');
    };
    checkOnboarding();
  }, []);

  if (!initialRoute || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <RootStack initialRoute={initialRoute} />
    </NavigationContainer>
  );
}

// ── Root Export ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
