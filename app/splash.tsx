// app/splash.tsx
import * as SplashScreen from 'expo-splash-screen';
import { Image, Animated, View, StyleSheet, Dimensions } from 'react-native';
import { useEffect, useState, useRef } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Get screen dimensions for animations
const { width, height } = Dimensions.get('window');

// Global flag to track if initial app load is complete
let isAppLoaded = false;

// Custom splash component with enhanced animations
import { ReactNode } from 'react';

export function AnimatedSplashScreen({ children }: { children: ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Handle smooth transition when app is ready
  useEffect(() => {
    if (isAppReady) {
      // Simple, elegant fade out transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1200, // Longer duration for smoother fade
        delay: 200,     // Small delay to ensure the app is ready
        useNativeDriver: true,
      }).start(() => {
        // Animation complete
        setIsSplashAnimationComplete(true);
        isAppLoaded = true;
      });
    }
  }, [isAppReady, fadeAnim]);

  // Preload app assets and prepare for transition
  const onImageLoaded = async () => {
    try {
      // Hide the native splash screen
      await SplashScreen.hideAsync();
      
      // Longer delay to ensure data is fully loaded before showing content
      // This helps avoid the double-loading effect
      setTimeout(() => {
        setIsAppReady(true);
      }, 400);
    } catch (e) {
      console.warn(e);
      // Fallback in case of error
      setIsAppReady(true);
    }
  };

  if (!isSplashAnimationComplete) {
    return (
      <View style={{ flex: 1 }}>
        {/* The app content underneath */}
        {isAppReady && children}
        
        {/* The splash overlay that fades out */}
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: fadeAnim,
            zIndex: 999,
          }}
        >
          <Image
            source={require('../assets/images/shreve_circle.png')}
            style={{
              width: 200,
              height: 200,
            }}
            onLoadEnd={onImageLoaded}
            fadeDuration={0}
          />
        </Animated.View>
      </View>
    );
  }

  return children;
}

// Function to manually hide the splash screen
export const hideSplashScreen = async () => {
  await SplashScreen.hideAsync();
};