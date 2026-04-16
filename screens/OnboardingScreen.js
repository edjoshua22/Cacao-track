import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Updated AnimatedLottie component
const AnimatedLottie = ({ source, isActive }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (animationRef.current) {
      if (isActive) {
        animationRef.current.reset();
        animationRef.current.play();
      } else {
        animationRef.current.pause();
      }
    }
  }, [isActive]);

  return (
    <View style={styles.lottieContainer}>
      <LottieView
        ref={animationRef}
        source={source}
        loop={true}
        style={styles.animation}
        resizeMode="contain"
        speed={1}
        hardwareAccelerationAndroid={true}
      />
    </View>
  );
};

const OnboardingScreen = ({ navigation }) => {
  const { isDark, colors } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
    } catch (error) {
      // Error saving onboarding status
    }
    
    if (navigation && navigation.replace) {
      navigation.replace('MainTabs');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
    } catch (error) {
      // Error saving onboarding status
    }
    
    if (navigation && navigation.replace) {
      navigation.replace('MainTabs');
    }
  };

  const handleSlideChange = (index) => {
    setCurrentIndex(index);
  };

  const slides = [
    {
      key: '1',
      title: 'Welcome to CacaoTrack!',
      text: 'Track your cacao fermentation process with real-time insights and expert guidance.',
      animation: require('../assets/animations/Welcome.json'),
      backgroundColor: colors.background,
    },
    {
      key: '2',
      title: 'Monitor Fermentation Batches',
      text: 'Easily track cacao batch, fermentation stages, temperature, humidity, moisture and progress.',
      animation: require('../assets/animations/WelcomeAnimation.json'),
      backgroundColor: colors.background,
    },
    {
      key: '3',
      title: 'Stay Updated',
      text: 'Receive instant notifications about fermentation milestones, quality checks, and alerts.',
      animation: require('../assets/animations/Notifications.json'),
      backgroundColor: colors.background,
    },
  ];

  const renderItem = ({ item, index }) => {
    const isActive = index === currentIndex;
    
    return (
      <SafeAreaView style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <AnimatedLottie 
          source={item.animation} 
          isActive={isActive}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.text, { color: colors.subtext }]}>{item.text}</Text>
        </View>
      </SafeAreaView>
    );
  };

  const renderNextButton = () => {
    return (
      <View style={[styles.buttonCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <View style={[styles.buttonCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={24} color="#fff" />
      </View>
    );
  };

  const renderSkipButton = () => {
    return (
      <View style={styles.skipButton}>
        <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppIntroSlider
        renderItem={renderItem}
        data={slides}
        onDone={handleDone}
        onSkip={handleSkip}
        onSlideChange={handleSlideChange}
        renderNextButton={renderNextButton}
        renderDoneButton={renderDoneButton}
        renderSkipButton={renderSkipButton}
        showSkipButton
        dotStyle={styles.dotStyle}
        activeDotStyle={[styles.activeDotStyle, { backgroundColor: colors.primary }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lottieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.5,
    width: width,
    paddingHorizontal: 20,
  },
  animation: {
    width: width * 0.85,
    height: height * 0.45,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dotStyle: {
    backgroundColor: 'rgba(0, 0, 0, .2)',
  },
  activeDotStyle: {
    width: 30,
  },
});

export default OnboardingScreen;
