/**
 * @file OnboardingScreen.js
 * @description Migrated from screens/OnboardingScreen.js. Dumb screen — uses useOnboarding hook only.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import LottieView         from 'lottie-react-native';
import AppIntroSlider     from 'react-native-app-intro-slider';
import { useAppTheme }    from '../../../../../context/ThemeContext';
import { Ionicons }       from '@expo/vector-icons';
import { useOnboarding }  from '../hooks/useOnboarding';

const { width, height } = Dimensions.get('window');

// Animation source map keyed by animationKey
const ANIMATIONS = {
  Welcome:          require('../../../../../assets/animations/Welcome.json'),
  WelcomeAnimation: require('../../../../../assets/animations/WelcomeAnimation.json'),
  Notifications:    require('../../../../../assets/animations/Notifications.json'),
};

const AnimatedLottie = ({ source, isActive }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (isActive) { ref.current.reset(); ref.current.play(); }
    else            { ref.current.pause(); }
  }, [isActive]);
  return (
    <View style={styles.lottieContainer}>
      <LottieView ref={ref} source={source} loop style={styles.animation} resizeMode="contain" speed={1} hardwareAccelerationAndroid/>
    </View>
  );
};

export default function OnboardingScreen({ navigation }) {
  const { isDark, colors }                             = useAppTheme();
  const { slides, currentIndex, complete, handleSlideChange } = useOnboarding();

  const handleDone = async () => { await complete(); if (navigation?.replace) navigation.replace('MainTabs'); };
  const handleSkip = async () => { await complete(); if (navigation?.replace) navigation.replace('MainTabs'); };

  const renderItem = ({ item, index }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: colors.background }]}>
      <AnimatedLottie source={ANIMATIONS[item.animationKey]} isActive={index === currentIndex}/>
      <View style={styles.textContainer}>
        <Text style={[styles.title,{color:colors.text}]}>{item.title}</Text>
        <Text style={[styles.text,{color:colors.subtext}]}>{item.text}</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={{flex:1,backgroundColor:colors.background}}>
      <StatusBar barStyle={isDark?'light-content':'dark-content'} backgroundColor={colors.background} translucent={false}/>
      <AppIntroSlider
        renderItem={renderItem}
        data={slides.map(s => ({...s,backgroundColor:colors.background}))}
        onDone={handleDone}
        onSkip={handleSkip}
        onSlideChange={handleSlideChange}
        renderNextButton={() => <View style={[styles.buttonCircle,{backgroundColor:colors.primary}]}><Ionicons name="arrow-forward" size={24} color="#fff"/></View>}
        renderDoneButton={() => <View style={[styles.buttonCircle,{backgroundColor:colors.primary}]}><Ionicons name="checkmark" size={24} color="#fff"/></View>}
        renderSkipButton={() => <View style={styles.skipButton}><Text style={[styles.skipText,{color:colors.primary}]}>Skip</Text></View>}
        showSkipButton
        dotStyle={styles.dotStyle}
        activeDotStyle={[styles.activeDotStyle,{backgroundColor:colors.primary}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slide:         { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:20 },
  lottieContainer:{ justifyContent:'center', alignItems:'center', height:height*0.5, width, paddingHorizontal:20 },
  animation:     { width:width*0.85, height:height*0.45 },
  textContainer: { alignItems:'center', paddingHorizontal:30, marginTop:20 },
  title:         { fontSize:26, fontWeight:'bold', textAlign:'center', marginBottom:10 },
  text:          { fontSize:16, textAlign:'center', lineHeight:24 },
  buttonCircle:  { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center' },
  skipButton:    { padding:12 },
  skipText:      { fontSize:16, fontWeight:'600' },
  dotStyle:      { backgroundColor:'rgba(0,0,0,.2)' },
  activeDotStyle:{ width:30 },
});
