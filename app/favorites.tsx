// app/screens/FavoritesScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFavorites } from './context/FavoritesContext';
import { Watch } from '../app/types/Watch';
import { ArtPiece } from '../app/types/ArtPiece';
import { WatchCard } from './components/WatchCard';

import { FixedHeader } from './components/FixedHeader';

type FavoriteItem = Watch | ArtPiece;

export default function FavoritesScreen() {
  const { favorites } = useFavorites();

  // Type Guard: isWatch
  const isWatch = (item: FavoriteItem): item is Watch => {
    return (item as Watch).brand !== undefined && (item as Watch).model !== undefined;
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => {
    if (isWatch(item)) {
      return <WatchCard watch={item} />;
    }
    return null;
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <FixedHeader />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any item to add it to your favorites
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FixedHeader />
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  list: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002d4e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});