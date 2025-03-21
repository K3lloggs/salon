import * as SplashScreen from 'expo-splash-screen';
import { Image, Animated, View, StyleSheet } from 'react-native';
import { useEffect, useState, useRef, ReactNode } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export function AnimatedSplashScreen({ children }: { children: ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // When the app is ready, start the fade-out animation for the splash overlay
  useEffect(() => {
    if (isAppReady) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1200, // Smooth fade duration
        delay: 200,     // Delay to ensure the app is fully loaded
        useNativeDriver: true,
      }).start(() => {
        setIsSplashAnimationComplete(true);
      });
    }
  }, [isAppReady, fadeAnim]);

  // Called when the splash image has finished loading
  const onImageLoaded = async () => {
    try {
      await SplashScreen.hideAsync();
      // Delay to ensure any initial data is fully loaded
      setTimeout(() => {
        setIsAppReady(true);
      }, 400);
    } catch (e) {
      console.warn(e);
      setIsAppReady(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Always render the children once */}
      {children}
      {/* Overlay the splash screen until its animation is complete */}
      {!isSplashAnimationComplete && (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/images/shreve_circle.png')}
            style={styles.splashImage}
            onLoadEnd={onImageLoaded}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});
