/**
 * App.js — Root entry point with premium floating tab bar.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, LogBox, Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage                   from '@react-native-async-storage/async-storage';
import { NavigationContainer }        from '@react-navigation/native';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView }     from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons }                   from '@expo/vector-icons';
import { LinearGradient }             from 'expo-linear-gradient';

import { ThemeProvider, useAppTheme } from './context/ThemeContext';

// ── Screens ───────────────────────────────────────────────────────────────────
import MonitoringScreen          from './screens/MonitoringScreen';
import AnalyticsScreen           from './screens/AnalyticsScreen';
import TimelineScreen            from './screens/TimelineScreen';
import NotificationScreen        from './screens/NotificationScreen';
import OnboardingScreen          from './screens/OnboardingScreen';
import BatchDetail               from './screens/Details/BatchDetail';
import GraphDetail               from './screens/Details/GraphDetail';
import ImageDetail               from './screens/Details/ImageDetail';
import FermentationHistoryScreen from './screens/FermentationHistoryScreen';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate`',
]);

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'Monitoring',    icon: 'home',          label: 'Home'      },
  { name: 'Timeline',      icon: 'images',        label: 'Timeline'  },
  { name: 'Analytics',     icon: 'analytics',     label: 'Analytics' },
  { name: 'Notifications', icon: 'notifications', label: 'Alerts'    },
];

// ── Premium Custom Tab Bar ────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      tabStyles.wrapper,
      { paddingBottom: insets.bottom + 8, backgroundColor: colors.tabBar }
    ]}>
      {/* Top border accent line */}
      <View style={[tabStyles.topBorder, { backgroundColor: colors.border }]} />

      <View style={tabStyles.row}>
        {state.routes.map((route, index) => {
          const tab     = TABS[index];
          const focused = state.index === index;

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
              {/* Active pill background */}
              {focused && (
                <LinearGradient
                  colors={[colors.primary + '30', colors.primary + '10']}
                  style={tabStyles.activePill}
                />
              )}

              {/* Icon */}
              <View style={[
                tabStyles.iconWrap,
                focused && { backgroundColor: colors.primary + '20' },
              ]}>
                <Ionicons
                  name={focused ? tab.icon : `${tab.icon}-outline`}
                  size={22}
                  color={focused ? colors.primary : colors.subtext}
                />
              </View>

              {/* Label */}
              <Text style={[
                tabStyles.label,
                { color: focused ? colors.primary : colors.subtext },
                focused && { fontWeight: '700' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 0,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  topBorder: {
    height: 1,
    width: '100%',
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activePill: {
    position:     'absolute',
    top:          -4,
    left:         8,
    right:        8,
    bottom:       -4,
    borderRadius: 16,
  },
  iconWrap: {
    width:         40,
    height:        40,
    borderRadius:  20,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:   2,
  },
  label: {
    fontSize:    10,
    fontWeight:  '600',
    letterSpacing: 0.3,
    marginTop:   2,
  },
});

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={
            tab.name === 'Monitoring'    ? MonitoringScreen   :
            tab.name === 'Timeline'      ? TimelineScreen     :
            tab.name === 'Analytics'     ? AnalyticsScreen    :
            NotificationScreen
          }
        />
      ))}
    </Tab.Navigator>
  );
}

// ── Root Stack ────────────────────────────────────────────────────────────────
function RootStack({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
    >
      <Stack.Screen name="Onboarding"          component={OnboardingScreen}          />
      <Stack.Screen name="MainTabs"            component={MainTabs}                  />
      <Stack.Screen name="BatchDetail"         component={BatchDetail}               />
      <Stack.Screen name="GraphDetail"         component={GraphDetail}               />
      <Stack.Screen name="ImageDetail"         component={ImageDetail}               />
      <Stack.Screen name="FermentationHistory" component={FermentationHistoryScreen} />
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
        await AsyncStorage.removeItem('onboardingComplete').catch(() => {});
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
