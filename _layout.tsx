import { Stack } from 'expo-router';
import { SortProvider } from './app/context/SortContext';
import { FavoritesProvider } from './app/context/FavoritesContext';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { View } from 'react-native';

function AppLayout() {
    const { isDark } = useTheme();
    
    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
            <FavoritesProvider>
                <SortProvider>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="favorites" options={{
                            title: 'Favorites',
                            headerStyle: {
                                backgroundColor: isDark ? '#222' : '#ffffff',
                            },
                            headerTintColor: isDark ? '#fff' : '#002d4e',
                        }} />
                    </Stack>
                </SortProvider>
            </FavoritesProvider>
        </View>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AppLayout />
        </ThemeProvider>
    );
}