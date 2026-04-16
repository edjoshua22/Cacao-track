import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Background from "../components/Background";
import { useAppTheme } from "../context/ThemeContext";
import { getDatabase, ref, onValue, off, push, set, get } from "firebase/database";
import { app } from "../firebaseConfig";
import { initializeAuth, getUserId } from "../utils/authUtils";

export default function NotificationScreen() {
  const { colors } = useAppTheme();
  const db = getDatabase(app);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let notificationsUnsubscribe = null;
    let sensorDataUnsubscribe = null;
    let capturesUnsubscribe = null;
    
    const setupListeners = async () => {
      try {
        await initializeAuth();
        const userId = getUserId();
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const notificationsRef = ref(db, `notifications/${userId}`);
        const sensorDataRef = ref(db, "sensorData");
        const capturesRef = ref(db, `captures/${userId}`);

        // Listen to notification changes in real-time
        notificationsUnsubscribe = onValue(notificationsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const notifArray = Object.entries(data).map(([id, notif]) => ({
              id,
              ...notif,
            }));
            notifArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotifications(notifArray);
          } else {
            setNotifications([]);
          }
          setLoading(false);
        });

        // Listen to live sensor data and trigger notifications
        sensorDataUnsubscribe = onValue(sensorDataRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.val();
          const latestEntries = Object.values(data).slice(-1); // last reading only

          for (const entry of latestEntries) {
            const temp = parseFloat(entry.temperature) || 0;
            const humidity = parseFloat(entry.humidity) || 0;
            const moisture = parseFloat(entry.moisture) || 0;

            if (temp > 55) {
              await createNotification({
                type: "alert",
                title: "High Temperature Alert",
                message: `Temperature is ${temp.toFixed(1)}°C — exceeds safe range (45-50°C).`,
                icon: "thermometer",
                priority: "high",
              });
            } else if (temp < 40) {
              await createNotification({
                type: "warning",
                title: "Low Temperature Warning",
                message: `Temperature is ${temp.toFixed(1)}°C — below optimal range.`,
                icon: "snow",
                priority: "medium",
              });
            }

            if (humidity > 85) {
              await createNotification({
                type: "alert",
                title: "High Humidity Alert",
                message: `Humidity is ${humidity.toFixed(1)}% — risk of mold growth.`,
                icon: "water",
                priority: "high",
              });
            } else if (humidity < 55) {
              await createNotification({
                type: "warning",
                title: "Low Humidity Warning",
                message: `Humidity is ${humidity.toFixed(1)}% — fermentation may slow.`,
                icon: "sunny",
                priority: "medium",
              });
            }

            if (moisture > 65) {
              await createNotification({
                type: "warning",
                title: "High Moisture Level",
                message: `Moisture is ${moisture.toFixed(0)}% — consider drying.`,
                icon: "rainy",
                priority: "medium",
              });
            } else if (moisture < 35) {
              await createNotification({
                type: "warning",
                title: "Low Moisture Level",
                message: `Moisture is ${moisture.toFixed(0)}% — may cause incomplete fermentation.`,
                icon: "leaf",
                priority: "medium",
              });
            }
          }
        });

        // Check for day 6 drying readiness based on captures
        capturesUnsubscribe = onValue(capturesRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          
          const captures = snapshot.val();
          const captureEntries = Object.entries(captures);
          
          if (captureEntries.length === 0) return;
          
          // Find the earliest capture (start of fermentation)
          const sortedCaptures = captureEntries.sort((a, b) => {
            const timeA = parseTimestamp(a[0]);
            const timeB = parseTimestamp(b[0]);
            return timeA - timeB;
          });
          
          const firstCapture = sortedCaptures[0];
          if (!firstCapture) return;
          
          const startTime = parseTimestamp(firstCapture[0]);
          const currentTime = Date.now();
          
          // Calculate days since fermentation started
          const daysElapsed = Math.floor((currentTime - startTime) / (1000 * 60 * 60 * 24));
          
          // Define fermentation stages for each day
          const fermentationStages = {
            0: { title: "🌰 Fermentation Started!", message: "Day 0: Fresh cacao beans begin fermentation process.", icon: "leaf-outline" },
            1: { title: "⚡ Anaerobic Phase", message: "Day 1: Anaerobic fermentation begins - flavor development starts.", icon: "flash-outline" },
            2: { title: "🍷 Alcoholic Fermentation", message: "Day 2: Alcoholic fermentation active - complex flavors forming.", icon: "wine-outline" },
            3: { title: "🌬️ Aerobic Phase", message: "Day 3: Aerobic fermentation begins - acidity development.", icon: "air-outline" },
            4: { title: "🔄 Continued Aerobic", message: "Day 4: Aerobic fermentation continues - flavor maturation.", icon: "sync-outline" },
            5: { title: "🌿 Maturation Phase", message: "Day 5: Final fermentation stage - flavors stabilizing.", icon: "nutrition-outline" },
            6: { title: "🌱 Ready for Drying!", message: "Day 6 reached! Your cacao beans are now ready for the drying phase. The fermentation process is complete.", icon: "sunny-outline" }
          };
          
          // Create notification for current day if it exists in our stages
          if (fermentationStages[daysElapsed]) {
            const stage = fermentationStages[daysElapsed];
            
            // Check if we already sent a notification for this day in the past 12 hours
            const notificationsRef = ref(db, `notifications/${userId}`);
            const notificationsSnapshot = await get(notificationsRef);
            
            let shouldCreateNotification = true;
            
            if (notificationsSnapshot.exists()) {
              const existingNotifications = Object.values(notificationsSnapshot.val());
              const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
              
              const hasDayNotification = existingNotifications.some(
                (notif) => 
                  notif.title && 
                  notif.title.includes(`Day ${daysElapsed}:`) && 
                  notif.timestamp > twelveHoursAgo
              );
              
              shouldCreateNotification = !hasDayNotification;
            }
            
            // Only create notification if we haven't sent one recently
            if (shouldCreateNotification) {
              await createNotification({
                type: daysElapsed === 6 ? "info" : "info",
                title: stage.title,
                message: stage.message,
                icon: stage.icon,
                priority: daysElapsed === 6 ? "high" : "medium",
              });
            }
          }
        });
      } catch (error) {
        console.error('NotificationScreen: Failed to setup listeners:', error);
        setLoading(false);
      }
    };
    
    setupListeners();

    return () => {
      if (notificationsUnsubscribe) off(notificationsRef);
      if (sensorDataUnsubscribe) off(sensorDataRef);
      if (capturesUnsubscribe) off(capturesRef);
    };
  }, []);

  const createNotification = async (notif) => {
    try {
      await initializeAuth();
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const notificationsRef = ref(db, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);

      // Avoid duplicate alerts within the past hour
      if (snapshot.exists()) {
        const existing = Object.values(snapshot.val());
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const hasSimilar = existing.some(
          (n) => n.title === notif.title && n.timestamp > oneHourAgo
        );
        if (hasSimilar) return;
      }

      const newNotifRef = push(notificationsRef);
      await set(newNotifRef, {
        ...notif,
        timestamp: Date.now(),
        read: false,
      });
    } catch (error) {
      console.error('NotificationScreen: Error creating notification:', error);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await initializeAuth();
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif) return;
      const notifRef = ref(db, `notifications/${userId}/${notifId}`);
      await set(notifRef, { ...notif, read: true });
    } catch (error) {
      console.error('NotificationScreen: Error marking as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await initializeAuth();
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const notificationsRef = ref(db, `notifications/${userId}`);
      await set(notificationsRef, null);
      setNotifications([]);
    } catch (error) {
      console.error('NotificationScreen: Error clearing notifications:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const getIconColor = (type) => {
    switch (type) {
      case "alert":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      case "info":
        return "#3B82F6";
      default:
        return colors?.primary;
    }
  };

  const getIconBackground = (type) => {
    switch (type) {
      case "alert":
        return colors?.errorBg || "#FEE2E2";
      case "warning":
        return colors?.warnBg || "#FEF3C7";
      case "info":
        return colors?.infoBg || "#DBEAFE";
      default:
        return colors?.card || "#F3F4F6";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "alerts") return notif.type === "alert" || notif.type === "warning";
    if (filter === "info") return notif.type === "info";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors?.primary} />
          <Text style={[styles.loadingText, { color: colors?.subtext }]}>
            Loading notifications...
          </Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background variant="gradient">
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors?.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { color: colors?.primary }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={[styles.clearText, { color: colors?.primary }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        {notifications.length > 0 && (
          <View style={styles.filterContainer}>
            {["all", "alerts", "info"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      filter === type ? colors?.primary : colors?.card,
                  },
                ]}
                onPress={() => setFilter(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        filter === type ? "#fff" : colors?.subtext,
                    },
                  ]}
                >
                  {type === "all"
                    ? `All (${notifications.length})`
                    : type === "alerts"
                    ? `Alerts (${notifications.filter(
                        (n) => n.type === "alert" || n.type === "warning"
                      ).length})`
                    : `Info (${notifications.filter(
                        (n) => n.type === "info"
                      ).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notifications List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredNotifications.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={colors?.subtext}
              />
              <Text style={[styles.emptyTitle, { color: colors?.text }]}>
                No {filter} notifications
              </Text>
              <Text style={[styles.emptyText, { color: colors?.subtext }]}>
                You're all caught up! Notifications will appear here when real
                sensor alerts occur.
              </Text>
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => markAsRead(notif.id)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.notifCard,
                    !notif.read && styles.unreadCard,
                    { borderLeftColor: colors?.primary },
                  ]}
                >
                  <View style={styles.notifContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: getIconBackground(notif.type) },
                      ]}
                    >
                      <Ionicons
                        name={notif.icon || "notifications"}
                        size={24}
                        color={getIconColor(notif.type)}
                      />
                    </View>
                    <View style={styles.notifTextContainer}>
                      <Text style={[styles.notifTitle, { color: colors?.text }]}>
                        {notif.title}
                      </Text>
                      <Text style={[styles.notifMessage, { color: colors?.text }]}>
                        {notif.message}
                      </Text>
                      <Text style={[styles.notifTime, { color: colors?.subtext }]}>
                        {formatTimestamp(notif.timestamp)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

function formatTimestamp(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleString();
}

function parseTimestamp(ts) {
  try {
    const [d, t] = ts.includes('_') ? ts.split('_') : ts.split(' ');
    const [y, m, day] = d.split('-').map(Number);
    const [h, min, s] = t.split(/[-:]/).map(Number);
    return new Date(y, m - 1, day, h, min, s);
  } catch {
    return Date.now();
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  clearText: { fontSize: 14, fontWeight: "600" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  notifCard: { marginBottom: 12, padding: 16 },
  unreadCard: { borderLeftWidth: 4 },
  notifContent: { flexDirection: "row", alignItems: "flex-start" },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifTextContainer: { flex: 1 },
  notifTitle: { fontSize: 16, fontWeight: "700" },
  notifMessage: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  notifTime: { fontSize: 12 },
  emptyCard: { alignItems: "center", padding: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
});
