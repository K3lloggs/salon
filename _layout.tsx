import { Stack } from 'expo-router';
import { SortProvider } from './app/context/SortContext';
import { FavoritesProvider } from './app/context/FavoritesContext';

export default function RootLayout() {
    return (
        <FavoritesProvider>
            <SortProvider>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="favorites" options={{
                        title: 'Favorites',
                        headerStyle: {
                            backgroundColor: '#ffffff',
                        },
                        headerTintColor: '#002d4e',
                    }} />
                </Stack>
            </SortProvider>
        </FavoritesProvider>
    );
}