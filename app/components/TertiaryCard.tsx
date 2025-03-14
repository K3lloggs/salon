import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites} from '../context/FavoritesContext';
import { useRouter } from 'expo-router'
import { Watch } from '../types/Watch';

interface TertiaryCardProps {
    watch: Watch;
}

export function TertiaryCard({ watch }: TertiaryCardProps) {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const router = useRouter();
    const isLiked = isFavorite(watch.id);

    const toggleFavorite = (event: any) => {
        event.stopPropagation();
        if (isLiked) {
            removeFavorite(watch.id);
        } else {
            addFavorite(watch);
        }
    };

    return (
        <Pressable 
            style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.9 }
            ]}
            onPress={() => router.push(`./watch/${watch.id}`)}
        >
            <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                    <Text style={styles.brand}>{watch.brand}</Text>
                    <Text style={styles.model}>{watch.model}</Text>
                    <View style={styles.infoRow}>
                        {watch.year && <Text style={styles.year}>{watch.year}</Text>}
                        <Text style={styles.price}>${watch.price.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={styles.imageContainer}>
                    <TouchableOpacity
                        style={styles.heartButton}
                        onPress={toggleFavorite}
                    >
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={24}
                            color={isLiked ? "#ff4d4d" : "#002d4e"}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        height: 120,
    },
    textContainer: {
        flex: 2,
        justifyContent: 'center',
        paddingLeft: 20,
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#e0e0e0',
        position: 'relative',
    },
    brand: {
        fontSize: 20,
        fontWeight: '700',
        color: '#002d4e',
        marginBottom: 2,
    },
    model: {
        fontSize: 16,
        fontWeight: '600',
        color: '#002d4e',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 16,
    },
    year: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    price: {
        fontSize: 16,
        fontWeight: '600',
        color: '#002d4e',
    },
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
    },
});