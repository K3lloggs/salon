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
import Colors from '../constants/Colors';

function MainLayout() {
  const { isLoading } = useLoading();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <FavoritesProvider>
        <SortProvider>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              presentation: 'card',
              animationDuration: 200,
              contentStyle: { backgroundColor: Colors.offWhite }
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