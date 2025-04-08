// app/RootLayout.tsx
import { Stack } from 'expo-router';
import { SortProvider } from './context/SortContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { StatusBar, View } from 'react-native';
import { AnimatedSplashScreen } from './splash';
import { LoadingProvider } from './context/LoadingContext';
import { LoadingOverlay } from './components/LoadingOverlay';
import { useLoading } from './context/LoadingContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function MainLayout() {
  const { isLoading } = useLoading();
  const router = useRouter();
  
  // Handle deep links
  useEffect(() => {
    // Function to handle deep links - extracts the watch ID from URLs like:
    // watchsalon://watch/123 or exp://192.168.x.x:port/--/watch/123
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log("Deep link received:", url);
      
      // Check if this is a watch detail link
      if (url.includes('/watch/')) {
        // Extract the watch ID from the URL
        const regex = /\/watch\/([^\/\?]+)/;
        const match = url.match(regex);
        
        if (match && match[1]) {
          const watchId = match[1];
          console.log("Navigating to watch ID:", watchId);
          
          // Navigate to the watch screen with the extracted ID
          router.push(`/watch/${watchId}`);
        }
      }
    };
    
    // Add event listener for deep links when app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check for initial URL that may have launched the app
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log("Initial URL:", initialUrl);
      
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    };
    
    getInitialUrl();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [router]);
  
  return (
    <View style={{ flex: 1 }}>
      <FavoritesProvider>
        <SortProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              presentation: 'card',
              animationDuration: 200,
            }}
          >
            {/* Main Tab Navigation */}
            <Stack.Screen name="(tabs)" />
            {/* Other Routes */}
            <Stack.Screen name="(screens)/fine-art" />
            <Stack.Screen name="(screens)/fine-art/[id]" />
            <Stack.Screen name="watch/[id]" />
            <Stack.Screen name="Watches" />
            <Stack.Screen name="FilterScreen" />
          </Stack>
          
          {/* Global loading overlay */}
          <LoadingOverlay visible={isLoading} />
        </SortProvider>
      </FavoritesProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AnimatedSplashScreen>
      <StripeProvider
        publishableKey="pk_live_51KOAMQDYuNaEOlQ2nqKvmYdL45mnKhQxEdOCJX5kgcpCmlHueINBYyPmggU0LHhPtUsUr2bKG8Iph5xSXsGlmi3h008ESuHAo0"
        urlScheme="watchsalon" // Required for 3D Secure and bank redirects
      >
        <LoadingProvider>
          <MainLayout />
        </LoadingProvider>
      </StripeProvider>
    </AnimatedSplashScreen>
  );
}