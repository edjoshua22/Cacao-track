/**
 * @file StirrerControlScreen.js
 * @description Modal overlay for controlling the ESP32 stirrer motor.
 * Receives `visible` + `onClose` props from App.js and delegates all
 * logic to the useStirrerController hook.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Animated, Easing,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../context/ThemeContext';
import { useStirrerController } from '../src/features/stirrer/presentation/hooks/useStirrerController';

// ── Pulsing status ring ───────────────────────────────────────────────────────
function StatusRing({ color, isRunning }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let loop;
    if (isRunning) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim,   { toValue: 1.18, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim,   { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.4,  duration: 900, useNativeDriver: true }),
          ]),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.4);
    }
    return () => loop?.stop();
  }, [isRunning]);

  return (
    <View style={styles.ringContainer}>
      {/* Outer pulsing ring */}
      <Animated.View style={[
        styles.pulseRing,
        { borderColor: color, transform: [{ scale: pulseAnim }], opacity: opacityAnim },
      ]} />
      {/* Static middle ring */}
      <View style={[styles.middleRing, { borderColor: color + '60' }]} />
      {/* Inner icon circle */}
      <LinearGradient
        colors={isRunning ? [color + 'CC', color + '88'] : ['#2A2A2A', '#1A1A1A']}
        style={styles.innerCircle}
      >
        <Ionicons name="cog" size={36} color={isRunning ? '#fff' : color} />
      </LinearGradient>
    </View>
  );
}

// ── Control button ────────────────────────────────────────────────────────────
function ControlButton({ label, icon, gradientColors, onPress, disabled }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, friction: 8 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{ borderRadius: 16 }}
      >
        <LinearGradient
          colors={disabled ? ['#333', '#2A2A2A'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.controlBtn, disabled && styles.controlBtnDisabled]}
        >
          <Ionicons name={icon} size={20} color={disabled ? '#555' : '#fff'} />
          <Text style={[styles.controlBtnLabel, disabled && { color: '#555' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StirrerControlScreen({ visible, onClose }) {
  const { colors, isDark } = useAppTheme();
  const { vm, onStart, onStop, onSaveIp, onDismissError } = useStirrerController();
  const [ipDraft, setIpDraft] = useState('');
  const [ipEditing, setIpEditing] = useState(false);

  // Keep draft in sync when the saved IP changes
  useEffect(() => {
    setIpDraft(vm.espIp);
  }, [vm.espIp]);

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 120, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSaveIp = () => {
    onSaveIp(ipDraft);
    setIpEditing(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }]} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.card : '#FAFAF8',
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Stirrer Control</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>ESP32 Motor Controller</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Status ring */}
          <View style={styles.statusSection}>
            <StatusRing color={vm.statusColor} isRunning={vm.isRunning} />
            <Text style={[styles.statusLabel, { color: vm.statusColor }]}>{vm.statusLabel}</Text>
            <Text style={[styles.statusSub, { color: colors.subtext }]}>
              {vm.isRunning ? 'Motor is active' : 'Motor is idle'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlRow}>
            {vm.isSending ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subtext }]}>Sending command…</Text>
              </View>
            ) : (
              <>
                <ControlButton
                  label="Start"
                  icon="play"
                  gradientColors={['#22C55E', '#16A34A']}
                  onPress={onStart}
                  disabled={vm.isRunning}
                />
                <View style={{ width: 12 }} />
                <ControlButton
                  label="Stop"
                  icon="stop"
                  gradientColors={['#EF4444', '#B91C1C']}
                  onPress={onStop}
                  disabled={!vm.isRunning}
                />
              </>
            )}
          </View>

          {/* Error banner */}
          {vm.errorMessage ? (
            <Pressable onPress={onDismissError} style={styles.errorBanner}>
              <Ionicons name="warning" size={15} color="#EF4444" />
              <Text style={styles.errorText}>{vm.errorMessage}</Text>
              <Ionicons name="close-circle" size={15} color="#EF4444" />
            </Pressable>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* IP Configuration */}
          <View style={styles.ipSection}>
            <Text style={[styles.ipLabel, { color: colors.subtext }]}>
              <Ionicons name="wifi" size={13} /> &nbsp;ESP32 IP Address
            </Text>
            <View style={[
              styles.ipRow,
              { borderColor: ipEditing ? colors.primary : colors.border, backgroundColor: isDark ? '#1A1A1A' : '#F0EDE8' },
            ]}>
              <TextInput
                style={[styles.ipInput, { color: colors.text }]}
                value={ipDraft}
                onChangeText={setIpDraft}
                onFocus={() => setIpEditing(true)}
                onBlur={() => setIpEditing(false)}
                placeholder="192.168.1.100"
                placeholderTextColor={colors.subtext + '80'}
                keyboardType="numeric"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSaveIp}
              />
              <TouchableOpacity
                onPress={handleSaveIp}
                style={[styles.ipSaveBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status ring
  statusSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  ringContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2.5,
  },
  middleRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  innerCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  statusSub: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.4,
  },

  // Controls
  controlRow: {
    flexDirection: 'row',
    marginBottom: 16,
    minHeight: 56,
    alignItems: 'center',
  },
  loadingWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  controlBtnDisabled: {
    opacity: 0.5,
  },
  controlBtnLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF444415',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 12,
  },

  // Divider
  divider: {
    height: 1,
    marginBottom: 20,
  },

  // IP section
  ipSection: {
    gap: 10,
  },
  ipLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    paddingLeft: 14,
  },
  ipInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  ipSaveBtn: {
    width: 46,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
