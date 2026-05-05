/**
 * notificationUtils.js
 * Pure business-logic helpers for NotificationScreen.
 * No React imports — no UI.
 */
import { getDatabase, ref, get, push, set, off } from 'firebase/database';
import { app }                                    from '../firebaseConfig.secure';
import { initializeAuth, getUserId }              from '../utils/authUtils';

const ONE_HOUR_MS    = 60 * 60 * 1000;
const TWELVE_HOUR_MS = 12 * ONE_HOUR_MS;

// ── Timestamp helpers ─────────────────────────────────────────────────────────

/**
 * Parse a timestamp string or epoch number to a Date-like value.
 * @param {string} ts
 * @returns {number} epoch ms
 */
export const parseTimestamp = (ts) => {
  try {
    const [d, t] = ts.includes('_') ? ts.split('_') : ts.split(' ');
    const [y, m, day] = d.split('-').map(Number);
    const [h, min, s] = t.split(/[-:]/).map(Number);
    return new Date(y, m - 1, day, h, min, s).getTime();
  } catch {
    return Date.now();
  }
};

/**
 * Format a timestamp epoch into a human-readable relative time string.
 * @param {number} timestamp - epoch ms
 * @returns {string}
 */
export const formatTimestamp = (timestamp) => {
  const diff    = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return new Date(timestamp).toLocaleString();
};

// ── Icon helpers ──────────────────────────────────────────────────────────────

/** @param {string} type @returns {string} hex colour */
export const getIconColor = (type, colors) => {
  if (type === 'alert')   return '#EF4444';
  if (type === 'warning') return '#F59E0B';
  if (type === 'info')    return '#3B82F6';
  return colors?.primary;
};

/** @param {string} type @returns {string} background colour */
export const getIconBackground = (type, colors) => {
  if (type === 'alert')   return colors?.errorBg  || '#FEE2E2';
  if (type === 'warning') return colors?.warnBg   || '#FEF3C7';
  if (type === 'info')    return colors?.infoBg   || '#DBEAFE';
  return colors?.card || '#F3F4F6';
};

// ── Firebase actions ──────────────────────────────────────────────────────────

/**
 * Write a new notification if no similar one exists in the past hour.
 * @param {object} notif - { type, title, message, icon, priority }
 */
export const createNotification = async (notif) => {
  try {
    await initializeAuth();
    const userId = getUserId();
    if (!userId) return;

    const notifRef = ref(getDatabase(app), `notifications/${userId}`);
    const snapshot = await get(notifRef);

    if (snapshot.exists()) {
      const existing   = Object.values(snapshot.val());
      const oneHourAgo = Date.now() - ONE_HOUR_MS;
      if (existing.some(n => n.title === notif.title && n.timestamp > oneHourAgo)) return;
    }

    const newRef = push(notifRef);
    await set(newRef, { ...notif, timestamp: Date.now(), read: false });
  } catch (e) {
    console.error('createNotification error:', e);
  }
};

/**
 * Mark a single notification as read.
 * @param {string} userId
 * @param {object} notif - must have .id field
 */
export const markNotificationRead = async (userId, notif) => {
  if (!notif?.id) return;
  const db = getDatabase(app);
  await set(ref(db, `notifications/${userId}/${notif.id}`), { ...notif, read: true });
};

/**
 * Delete all notifications for a user.
 * @param {string} userId
 */
export const clearAllNotifications = async (userId) => {
  const db = getDatabase(app);
  await set(ref(db, `notifications/${userId}`), null);
};

// ── Sensor alert rules ────────────────────────────────────────────────────────

/**
 * Evaluate a sensor entry and return any notifications that should fire.
 * @param {{ temperature: number, humidity: number, moisture: number }} entry
 * @returns {object[]} Array of notification payloads.
 */
export const buildSensorAlerts = (entry) => {
  const temp     = parseFloat(entry.temperature) || 0;
  const humidity = parseFloat(entry.humidity)    || 0;
  const moisture = parseFloat(entry.moisture)    || 0;
  const alerts   = [];

  if (temp > 55)
    alerts.push({ type: 'alert',   title: 'High Temperature Alert', message: `Temperature is ${temp.toFixed(1)}°C — exceeds safe range (45-50°C).`, icon: 'thermometer',  priority: 'high'   });
  else if (temp < 40)
    alerts.push({ type: 'warning', title: 'Low Temperature Warning', message: `Temperature is ${temp.toFixed(1)}°C — below optimal range.`,          icon: 'snow',         priority: 'medium' });

  if (humidity > 85)
    alerts.push({ type: 'alert',   title: 'High Humidity Alert',   message: `Humidity is ${humidity.toFixed(1)}% — risk of mold growth.`,             icon: 'water',        priority: 'high'   });
  else if (humidity < 55)
    alerts.push({ type: 'warning', title: 'Low Humidity Warning',  message: `Humidity is ${humidity.toFixed(1)}% — fermentation may slow.`,           icon: 'sunny',        priority: 'medium' });

  if (moisture > 65)
    alerts.push({ type: 'warning', title: 'High Moisture Level',   message: `Moisture is ${moisture.toFixed(0)}% — consider drying.`,                 icon: 'rainy',        priority: 'medium' });
  else if (moisture < 35)
    alerts.push({ type: 'warning', title: 'Low Moisture Level',    message: `Moisture is ${moisture.toFixed(0)}% — may cause incomplete fermentation.`, icon: 'leaf',        priority: 'medium' });

  return alerts;
};

// ── Fermentation stage definitions ────────────────────────────────────────────
export const FERMENTATION_STAGES = {
  0: { title: '🌰 Fermentation Started!',   message: 'Day 0: Fresh cacao beans begin fermentation process.',                                                          icon: 'leaf-outline'      },
  1: { title: '⚡ Anaerobic Phase',          message: 'Day 1: Anaerobic fermentation begins - flavor development starts.',                                             icon: 'flash-outline'     },
  2: { title: '🍷 Alcoholic Fermentation',  message: 'Day 2: Alcoholic fermentation active - complex flavors forming.',                                               icon: 'wine-outline'      },
  3: { title: '🌬️ Aerobic Phase',           message: 'Day 3: Aerobic fermentation begins - acidity development.',                                                     icon: 'air-outline'       },
  4: { title: '🔄 Continued Aerobic',       message: 'Day 4: Aerobic fermentation continues - flavor maturation.',                                                    icon: 'sync-outline'      },
  5: { title: '🌿 Maturation Phase',        message: 'Day 5: Final fermentation stage - flavors stabilizing.',                                                        icon: 'nutrition-outline' },
  6: { title: '🌱 Ready for Drying!',       message: 'Day 6 reached! Your cacao beans are now ready for the drying phase. The fermentation process is complete.',     icon: 'sunny-outline'     },
};

/**
 * Check if a day-stage notification already fired in the past 12 h.
 * @param {object[]} existingNotifications
 * @param {number} daysElapsed
 * @returns {boolean}
 */
export const hasDayNotificationRecently = (existingNotifications, daysElapsed) => {
  const twelveHoursAgo = Date.now() - TWELVE_HOUR_MS;
  return existingNotifications.some(
    n => n.title?.includes(`Day ${daysElapsed}:`) && n.timestamp > twelveHoursAgo
  );
};
