// app/components/FavoriteButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function FavoriteButton() {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={[styles.iconButton, styles.favoriteButton]}
            // Change from './favorites' to '/favorites'
            onPress={() => router.push('/favorites')}
        >
            <Ionicons
                name="bookmark-outline"
                size={25}
                color="#000"
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    iconButton: {
        padding: 8,
        position: 'absolute',
        top: 55,
        zIndex: 1,
    },
    favoriteButton: {
        left: 16,
    },
});