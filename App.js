import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Alert,
  BackHandler,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  LogBox,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigation,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useAppTheme } from "./context/ThemeContext";
import { useFonts } from "expo-font";
import { logEnvironmentInfo, logProductionError } from './utils/debugUtils';
import { initializeAuth } from './utils/authUtils';

// Log environment info at app startup
logEnvironmentInfo();

// Initialize Firebase authentication early
initializeAuth().catch(error => {
  console.error('❌ Failed to initialize Firebase auth:', error);
});

// Handle global errors
if (!__DEV__) {
  const defaultErrorHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logProductionError(error, isFatal ? 'FATAL' : 'NON-FATAL');
    defaultErrorHandler(error, isFatal);
  });
}

LogBox.ignoreLogs([
    "SafeAreaView has been deprecated",
    "Production Error Debug",
    "Firebase",
    "DATABASE_INTERNAL_ERROR"
  ]);
// Screens
import OnboardingScreen from "./screens/OnboardingScreen";
import MonitoringScreen from "./screens/MonitoringScreen";
import TimelineScreen from "./screens/TimelineScreen";
import BatchScreen from "./screens/BatchScreen";
import GraphDetail from "./screens/Details/GraphDetail";
import ImageDetail from "./screens/Details/ImageDetail";
import BatchDetail from "./screens/Details/BatchDetail";
import NotificationScreen from "./screens/NotificationScreen";
import AboutScreen from "./screens/Menu/AboutScreen";
import StagesScreen from "./screens/Menu/StagesScreen";
import FunctionsScreen from "./screens/Menu/FunctionsScreen";
import SoftwareScreen from "./screens/Menu/SoftwareScreen";
import SettingsScreen from "./screens/Menu/SettingsScreen";
import AddButton from "./screens/AddButton"; 

function AddScreen() {
  return <AddButton />; 
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width, height } = Dimensions.get("window");


function ThemeStatusBar() {
  const { isDark, colors } = useAppTheme();
  return (
    <StatusBar
      backgroundColor={colors.primary}
      barStyle={isDark ? "light-content" : "dark-content"}
      translucent={false}
    />
  );
}

// App Header
function AppHeader({ navigation }) {
  const { colors } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(280)).current;

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 280,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const confirmExit = () => {
    Alert.alert(
      "Exit App",
      "Are you really sure you want to exit?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: true }
    );
  };

  const sidebarItems = [
    { icon: "information-circle-outline", label: "About", route: "About" },
    { icon: "leaf-outline", label: "Stages", route: "Stages" },
    { icon: "list-circle-outline", label: "Functions", route: "Functions" },
    { icon: "laptop-outline", label: "Software", route: "Software" },
    { icon: "settings-outline", label: "Settings", route: "Settings" },
  ];

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
      <Text style={styles.title}>CacaoTrack</Text>
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Sidebar Drawer */}
      <Modal transparent visible={menuVisible} animationType="none">
        <Pressable
          style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.sidebar,
              {
                backgroundColor: colors.primary,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Image
                source={require("./assets/cacaotrack_transparent.png")}
                style={styles.menuLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.menuList}>
              {sidebarItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuRow, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    toggleMenu();
                    if (item.route) navigation.navigate(item.route);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color="#fff"
                    style={{ width: 26 }}
                  />
                  <Text style={[styles.menuLabel, { color: "#fff" }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Exit button */}
            <TouchableOpacity
              style={[styles.exitRow, { backgroundColor: colors.primary }]}
              onPress={confirmExit}
            >
              <Ionicons
                name="exit-outline"
                size={20}
                color="#fff"
                style={{ width: 26 }}
              />
              <Text style={[styles.menuLabel, { color: "#fff" }]}>Exit</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const withHeader = (navigation) => <AppHeader navigation={navigation} />;

// Monitor Stack
function MonitorStack({ navigation }) {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitle: () => withHeader(navigation),
      }}
    >
      <Stack.Screen name="Monitoring" component={MonitoringScreen} />
      <Stack.Screen name="GraphDetail" component={GraphDetail} />
    </Stack.Navigator>
  );
}

// Timeline Stack
function TimelineStack({ navigation }) {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitle: () => withHeader(navigation),
      }}
    >
      <Stack.Screen name="TimelineMain" component={TimelineScreen} />
      <Stack.Screen name="ImageDetail" component={ImageDetail} />
    </Stack.Navigator>
  );
}

// Batch Stack
function BatchStack({ navigation }) {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitle: () => withHeader(navigation),
      }}
    >
      <Stack.Screen name="BatchMain" component={BatchScreen} />
      <Stack.Screen name="BatchDetail" component={BatchDetail} />
    </Stack.Navigator>
  );
}

// Notification Stack
function NotificationStack({ navigation }) {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitle: () => withHeader(navigation),
      }}
    >
      <Stack.Screen name="NotificationMain" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

// Tabs (Integrating AddButton)
function MainTabs() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.primary,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            paddingBottom: Platform.OS === "ios" ? 6 : 2,
            height: 60,
          },
        ],
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          if (route.name === "Monitor") iconName = "stats-chart-outline";
          else if (route.name === "Timeline") iconName = "images-outline";
          else if (route.name === "Add")
            return <AddButton onPress={() => navigation.navigate("Add")} />;
          else if (route.name === "Batch") iconName = "layers-outline";
          else if (route.name === "Notification")
            iconName = "notifications-outline";
          return (
            <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Monitor" component={MonitorStack} />
      <Tab.Screen name="Timeline" component={TimelineStack} />
      <Tab.Screen name="Add" component={AddButton} />
      <Tab.Screen name="Batch" component={BatchStack} />
      <Tab.Screen name="Notification" component={NotificationStack} />
    </Tab.Navigator>
  );
}

// Root Stack
function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding">
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Stages" component={StagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Functions" component={FunctionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Software" component={SoftwareScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Styles
const styles = StyleSheet.create({
  addContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  addText: {
    fontSize: 18,
    color: "#333",
  },
  headerContainer: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 33,
    color: "#fff",
    fontFamily: "Billabong",
  },
  menuButton: { padding: 0 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sidebar: {
    width: 240,
    paddingTop: 80,
    paddingHorizontal: 20,
    height: "100%",
    elevation: 8,
    justifyContent: "space-between",
  },
  menuHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    marginBottom: 10,
  },
  menuLogo: { width: 100, height: 100 },
  menuList: { flex: 1 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  exitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 12,
  },
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    paddingHorizontal: 15,
    paddingTop: 6,
  },
});

// Main App
export default function App() {
  const [fontsLoaded] = useFonts({
    Billabong: require("./assets/fonts/Billabong.otf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ThemeConsumerApp />
    </ThemeProvider>
  );
}

// Wrap NavigationContainer with theme and SafeAreaProvider
function ThemeConsumerApp() {
  const { isDark, colors } = useAppTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          ...(isDark ? DarkTheme : DefaultTheme),
          colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        }}
      >
        <ThemeStatusBar />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
