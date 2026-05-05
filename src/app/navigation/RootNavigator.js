/**
 * @file RootNavigator.js
 * @description Root navigator — migrated from App.js.
 * Determines initial route based on onboarding status, then renders the full navigator.
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer }          from '@react-navigation/native';
import { createNativeStackNavigator }   from '@react-navigation/native-stack';
import { createBottomTabNavigator }     from '@react-navigation/bottom-tabs';
import { Ionicons }                     from '@expo/vector-icons';
import { useAppTheme }                  from '../../../context/ThemeContext';

// ── Screens (new modular paths) ───────────────────────────────────────────────
import OnboardingScreen from '../../features/onboarding/presentation/screens/OnboardingScreen';
import BatchScreen      from '../../features/batch/presentation/screens/BatchScreen';
import FermentationHistoryScreen from '../../features/fermentation/presentation/screens/FermentationHistoryScreen';
import TimelineScreen   from '../../features/timeline/presentation/screens/TimelineScreen';

// ── Screens not yet migrated (kept from original location) ────────────────────
import MonitoringScreen    from '../../../screens/MonitoringScreen';
import NotificationScreen  from '../../../screens/NotificationScreen';
import BatchDetail         from '../../../screens/Details/BatchDetail';
import GraphDetail         from '../../../screens/Details/GraphDetail';
import ImageDetail         from '../../../screens/Details/ImageDetail';

// ── DI container for onboarding check ─────────────────────────────────────────
import container from '../../core/di/container';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor:  colors.border,
          paddingBottom:   4,
          height:          60,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Monitoring:    focused ? 'home'             : 'home-outline',
            Batch:         focused ? 'cube'             : 'cube-outline',
            Timeline:      focused ? 'images'           : 'images-outline',
            Notifications: focused ? 'notifications'    : 'notifications-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color}/>;
        },
      })}
    >
      <Tab.Screen name="Monitoring"    component={MonitoringScreen}/>
      <Tab.Screen name="Batch"         component={BatchScreen}/>
      <Tab.Screen name="Timeline"      component={TimelineScreen}/>
      <Tab.Screen name="Notifications" component={NotificationScreen}/>
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const useCase  = container.resolve('getOnboardingStepsUseCase');
        const result   = await useCase.execute();
        const isComplete = result.success ? result.data.isComplete : true;
        setInitialRoute(isComplete ? 'MainTabs' : 'Onboarding');
      } catch {
        setInitialRoute('MainTabs');
      }
    };
    check();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding"        component={OnboardingScreen}/>
        <Stack.Screen name="MainTabs"          component={MainTabs}/>
        <Stack.Screen name="BatchDetail"       component={BatchDetail}/>
        <Stack.Screen name="GraphDetail"       component={GraphDetail}/>
        <Stack.Screen name="ImageDetail"       component={ImageDetail}/>
        <Stack.Screen name="FermentationHistory" component={FermentationHistoryScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
