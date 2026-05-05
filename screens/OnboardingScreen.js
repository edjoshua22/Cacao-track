/**
 * OnboardingScreen.js
 * App intro slider shown on first launch.
 * Refactored: AnimatedLottie extracted, handleDone/handleSkip deduplicated, named export.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import AsyncStorage    from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView      from 'lottie-react-native';
import AppIntroSlider  from 'react-native-app-intro-slider';
import { Ionicons }    from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    title: 'Welcome to CacaoTrack!',
    text:  'Track your cacao fermentation process with real-time insights and expert guidance.',
    animation: require('../assets/animations/Welcome.json'),
  },
  {
    key: '2',
    title: 'Monitor Fermentation Batches',
    text:  'Easily track cacao batch, fermentation stages, temperature, humidity, moisture and progress.',
    animation: require('../assets/animations/WelcomeAnimation.json'),
  },
  {
    key: '3',
    title: 'Stay Updated',
    text:  'Receive instant notifications about fermentation milestones, quality checks, and alerts.',
    animation: require('../assets/animations/Notifications.json'),
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * AnimatedLottie — plays/pauses a Lottie animation based on slide focus.
 * @param {{ source: object, isActive: boolean }} props
 */
const AnimatedLottie = React.memo(({ source, isActive }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isActive) { ref.current.reset(); ref.current.play(); }
    else            ref.current.pause();
  }, [isActive]);

  return (
    <View style={styles.lottieContainer}>
      <LottieView
        ref={ref}
        source={source}
        loop
        style={styles.animation}
        resizeMode="contain"
        speed={1}
        hardwareAccelerationAndroid
      />
    </View>
  );
});

// ── Button render functions (defined once — not inline) ───────────────────────
const NextButton = (colors) => (
  <View style={[styles.buttonCircle, { backgroundColor: colors.primary }]}>
    <Ionicons name="arrow-forward" size={24} color="#fff" />
  </View>
);

const DoneButton = (colors) => (
  <View style={[styles.buttonCircle, { backgroundColor: colors.primary }]}>
    <Ionicons name="checkmark" size={24} color="#fff" />
  </View>
);

const SkipButton = (colors) => (
  <View style={styles.skipButton}>
    <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────

/**
 * OnboardingScreen — intro slider shown once on first app launch.
 */
const OnboardingScreen = ({ navigation }) => {
  const { isDark, colors }           = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  /** Persist onboarding completion and navigate to main app. */
  const finishOnboarding = useCallback(async () => {
    try { await AsyncStorage.setItem('onboardingComplete', 'true'); } catch { /* non-fatal */ }
    navigation?.replace?.('MainTabs');
  }, [navigation]);

  const handleSlideChange = useCallback((index) => setCurrentIndex(index), []);

  const renderItem = useCallback(({ item, index }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: colors.background }]}>
      <AnimatedLottie source={item.animation} isActive={index === currentIndex} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.text,  { color: colors.subtext }]}>{item.text}</Text>
      </View>
    </SafeAreaView>
  ), [currentIndex, colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppIntroSlider
        renderItem={renderItem}
        data={SLIDES}
        onDone={finishOnboarding}
        onSkip={finishOnboarding}
        onSlideChange={handleSlideChange}
        renderNextButton={() => NextButton(colors)}
        renderDoneButton={() => DoneButton(colors)}
        renderSkipButton={() => SkipButton(colors)}
        showSkipButton
        dotStyle={styles.dotStyle}
        activeDotStyle={[styles.activeDotStyle, { backgroundColor: colors.primary }]}
      />
    </View>
  );
};

export default OnboardingScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  slide:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  lottieContainer:{ justifyContent: 'center', alignItems: 'center', height: height * 0.5, width, paddingHorizontal: 20 },
  animation:      { width: width * 0.85, height: height * 0.45 },
  textContainer:  { alignItems: 'center', paddingHorizontal: 30, marginTop: 20 },
  title:          { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  text:           { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  buttonCircle:   { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  skipButton:     { padding: 12 },
  skipText:       { fontSize: 16, fontWeight: '600' },
  dotStyle:       { backgroundColor: 'rgba(0,0,0,.2)' },
  activeDotStyle: { width: 30 },
});
