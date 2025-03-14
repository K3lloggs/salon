// app/RootLayout.tsx
import { Stack } from 'expo-router';
import { SortProvider } from './context/SortContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { StatusBar, View } from 'react-native';
import { AnimatedSplashScreen } from './splash';
import { LoadingProvider } from './context/LoadingContext';
import { LoadingOverlay } from './components/LoadingOverlay';
import { useLoading } from './context/LoadingContext';

function MainLayout() {
  const { isLoading } = useLoading();
  
  return (
    <View style={{ flex: 1 }}>
      <FavoritesProvider>
        <SortProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <Stack
            screenOptions={{
              headerShown: false, // disable the default header for all screens
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
      <LoadingProvider>
        <MainLayout />
      </LoadingProvider>
    </AnimatedSplashScreen>
  );
}