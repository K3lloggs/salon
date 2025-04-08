import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Map all Cinzel weights
          'Cinzel-Regular': require('../../assets/fonts/Cinzel-Regular.ttf'),
          'Cinzel-Medium': require('../../assets/fonts/Cinzel-Medium.ttf'),
          'Cinzel-SemiBold': require('../../assets/fonts/Cinzel-SemiBold.ttf'),
          'Cinzel-Bold': require('../../assets/fonts/Cinzel-Bold.ttf'),
          'Cinzel-ExtraBold': require('../../assets/fonts/Cinzel-ExtraBold.ttf'),
          'Cinzel-Black': require('../../assets/fonts/Cinzel-Black.ttf'),
          
          // Keep Space Mono for backward compatibility
          'SpaceMono': require('../../assets/fonts/SpaceMono-Regular.ttf'),
        });
        
        // Hide the splash screen now that fonts are loaded
        await SplashScreen.hideAsync();
        
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts', error);
        // Set to true anyway to not block the app
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}