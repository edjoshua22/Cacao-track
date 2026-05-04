/**
 * NotificationScreen.js
 * Displays fermentation alerts and sensor warnings with real-time Firebase listeners.
 * Refactored: all pure logic moved to notificationUtils.js, sub-components extracted.
 */
import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import Card      from '../components/Card';
import Background from '../components/Background';
import { useAppTheme }        from '../context/ThemeContext';
import { app }                from '../firebaseConfig.secure';
import { initializeAuth, getUserId } from '../utils/authUtils';
import {
  formatTimestamp, getIconColor, getIconBackground,
  createNotification, markNotificationRead, clearAllNotifications,
  buildSensorAlerts, FERMENTATION_STAGES, hasDayNotificationRecently,
  parseTimestamp,
} from './notificationUtils';

// ── Sub-components ────────────────────────────────────────────────────────────

/** Header row with title, unread badge, and clear-all button. */
const NotifHeader = React.memo(({ title, unreadCount, hasNotifications, colors, onClearAll }) => (
  <View style={styles.header}>
    <View>
      <Text style={[styles.title, { color: colors?.text }]}>{title}</Text>
      {unreadCount > 0 && (
        <Text style={[styles.subtitle, { color: colors?.primary }]}>{unreadCount} unread</Text>
      )}
    </View>
    {hasNotifications && (
      <TouchableOpacity onPress={onClearAll}>
        <Text style={[styles.clearText, { color: colors?.primary }]}>Clear All</Text>
      </TouchableOpacity>
    )}
  </View>
));

/** Filter pill row (All / Alerts / Info). */
const FilterBar = React.memo(({ notifications, activeFilter, colors, onFilterChange }) => {
  const counts = useMemo(() => ({
    all:    notifications.length,
    alerts: notifications.filter(n => n.type === 'alert' || n.type === 'warning').length,
    info:   notifications.filter(n => n.type === 'info').length,
  }), [notifications]);

  const filters = [
    { key: 'all',    label: `All (${counts.all})`       },
    { key: 'alerts', label: `Alerts (${counts.alerts})` },
    { key: 'info',   label: `Info (${counts.info})`     },
  ];

  return (
    <View style={styles.filterContainer}>
      {filters.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.filterButton, { backgroundColor: activeFilter === key ? colors?.primary : colors?.card }]}
          onPress={() => onFilterChange(key)}
        >
          <Text style={[styles.filterText, { color: activeFilter === key ? '#fff' : colors?.subtext }]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

/** Single notification card. */
const NotifCard = React.memo(({ notif, colors, onPress }) => {
  const iconColor = getIconColor(notif.type, colors);
  const iconBg    = getIconBackground(notif.type, colors);

  return (
    <TouchableOpacity onPress={() => onPress(notif.id)} activeOpacity={0.7}>
      <Card style={[styles.notifCard, !notif.read && styles.unreadCard, { borderLeftColor: colors?.primary }]}>
        <View style={styles.notifContent}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name={notif.icon || 'notifications'} size={24} color={iconColor} />
          </View>
          <View style={styles.notifTextContainer}>
            <Text style={[styles.notifTitle,   { color: colors?.text }]}>{notif.title}</Text>
            <Text style={[styles.notifMessage, { color: colors?.text }]}>{notif.message}</Text>
            <Text style={[styles.notifTime,    { color: colors?.subtext }]}>
              {formatTimestamp(notif.timestamp)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

/** Empty state card. */
const EmptyState = React.memo(({ filter, colors }) => (
  <Card style={styles.emptyCard}>
    <Ionicons name="notifications-off-outline" size={64} color={colors?.subtext} />
    <Text style={[styles.emptyTitle, { color: colors?.text }]}>No {filter} notifications</Text>
    <Text style={[styles.emptyText,  { color: colors?.subtext }]}>
      You're all caught up! Notifications appear here when real sensor alerts occur.
    </Text>
  </Card>
));

// ── Main screen ───────────────────────────────────────────────────────────────

/**
 * NotificationScreen — shows fermentation alerts, sensor warnings, and milestone info.
 */
const NotificationScreen = () => {
  const { colors }                   = useAppTheme();
  const db                           = getDatabase(app);
  const [notifications, setNotifications] = useState([]);
  const [loading,        setLoading]      = useState(true);
  const [refreshing,     setRefreshing]   = useState(false);
  const [filter,         setFilter]       = useState('all');

  // ── Listener setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    let notifUnsub = null;
    let sensorUnsub = null;
    let capturesUnsub = null;
    let userId = null;

    const setup = async () => {
      try {
        await initializeAuth();
        userId = getUserId();
        if (!userId) throw new Error('Not authenticated');

        // 1) Notifications listener
        const notifRef = ref(db, `notifications/${userId}`);
        notifUnsub = onValue(notifRef, (snap) => {
          if (snap.exists()) {
            const arr = Object.entries(snap.val())
              .map(([id, n]) => ({ id, ...n }))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotifications(arr);
          } else {
            setNotifications([]);
          }
          setLoading(false);
        });

        // 2) Sensor data listener — fire alerts on threshold breach
        const sensorRef = ref(db, 'sensorData');
        sensorUnsub = onValue(sensorRef, async (snap) => {
          if (!snap.exists()) return;
          const latestEntry = Object.values(snap.val()).slice(-1)[0];
          if (!latestEntry) return;
          for (const alert of buildSensorAlerts(latestEntry)) {
            await createNotification(alert);
          }
        });

        // 3) Captures listener — fire day-milestone notifications
        const capturesRef = ref(db, `captures/${userId}`);
        capturesUnsub = onValue(capturesRef, async (snap) => {
          if (!snap.exists()) return;
          const entries = Object.entries(snap.val());
          if (!entries.length) return;

          const sorted      = entries.sort((a, b) => parseTimestamp(a[0]) - parseTimestamp(b[0]));
          const startTime   = parseTimestamp(sorted[0][0]);
          const daysElapsed = Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24));

          if (!FERMENTATION_STAGES[daysElapsed]) return;

          const notifSnap = await get(ref(db, `notifications/${userId}`));
          const existing  = notifSnap.exists() ? Object.values(notifSnap.val()) : [];

          if (!hasDayNotificationRecently(existing, daysElapsed)) {
            const stage = FERMENTATION_STAGES[daysElapsed];
            await createNotification({
              type:     'info',
              title:    stage.title,
              message:  stage.message,
              icon:     stage.icon,
              priority: daysElapsed === 6 ? 'high' : 'medium',
            });
          }
        });
      } catch (e) {
        console.error('NotificationScreen setup error:', e);
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (notifUnsub)    notifUnsub();
      if (sensorUnsub)   sensorUnsub();
      if (capturesUnsub) capturesUnsub();
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (id) => {
    const userId = getUserId();
    if (!userId) return;
    const notif = notifications.find(n => n.id === id);
    if (notif) await markNotificationRead(userId, notif);
  }, [notifications]);

  const handleClearAll = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    await clearAllNotifications(userId);
    setNotifications([]);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    if (filter === 'alerts') return notifications.filter(n => n.type === 'alert' || n.type === 'warning');
    if (filter === 'info')   return notifications.filter(n => n.type === 'info');
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors?.primary} />
          <Text style={[styles.loadingText, { color: colors?.subtext }]}>Loading notifications...</Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background variant="gradient">
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <NotifHeader
          title="Notifications"
          unreadCount={unreadCount}
          hasNotifications={notifications.length > 0}
          colors={colors}
          onClearAll={handleClearAll}
        />

        {notifications.length > 0 && (
          <FilterBar
            notifications={notifications}
            activeFilter={filter}
            colors={colors}
            onFilterChange={setFilter}
          />
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {filteredNotifications.length === 0 ? (
            <EmptyState filter={filter} colors={colors} />
          ) : (
            filteredNotifications.map(notif => (
              <NotifCard key={notif.id} notif={notif} colors={colors} onPress={handleMarkRead} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

export default NotificationScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:       { marginTop: 12, fontSize: 14 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  title:             { fontSize: 28, fontWeight: '800' },
  subtitle:          { fontSize: 14, fontWeight: '600', marginTop: 4 },
  clearText:         { fontSize: 14, fontWeight: '600' },
  filterContainer:   { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  filterButton:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText:        { fontSize: 13, fontWeight: '600' },
  notifCard:         { marginBottom: 12, padding: 16 },
  unreadCard:        { borderLeftWidth: 4 },
  notifContent:      { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer:     { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTextContainer:{ flex: 1 },
  notifTitle:        { fontSize: 16, fontWeight: '700' },
  notifMessage:      { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  notifTime:         { fontSize: 12 },
  emptyCard:         { alignItems: 'center', padding: 48 },
  emptyTitle:        { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText:         { fontSize: 14, textAlign: 'center' },
});
