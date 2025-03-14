import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WatchCard } from '../components/WatchCard';
import { useWatches } from '../hooks/useWatches';
import { Ionicons } from '@expo/vector-icons';

function BrandDetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      {/* Back button */}
      <Pressable onPress={onBack} style={styles.headerButton}>
        <Ionicons name="arrow-back" size={24} color="#002d4e" />
      </Pressable>

      {/* Centered brand name */}
      <Text style={styles.headerTitle}>{title}</Text>

      {/* Placeholder to balance the layout */}
      <View style={styles.headerPlaceholder} />
    </View>
  );
}

export default function BrandDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  // Retrieve the clicked brand name from route parameters
  const brandName =
    typeof params.brandName === 'string' ? params.brandName : '';
  const { watches, loading, error } = useWatches();
  const [refreshing, setRefreshing] = useState(false);

  // Filter watches by brand (case insensitive)
  const filteredWatches = useMemo(() => {
    return watches.filter(
      (watch) => watch.brand.toLowerCase() === brandName.toLowerCase()
    );
  }, [brandName, watches]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Replace with your actual refresh logic
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Navigate back
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom header used only on BrandDetailScreen */}
      <BrandDetailHeader title={brandName} onBack={handleBack} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002d4e" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Error loading {brandName} watches.
          </Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : filteredWatches.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="watch-outline" size={70} color="#002d4e" />
          <Text style={styles.emptyTitle}>
            No {brandName} Watches Available
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWatches}
          renderItem={({ item }) => <WatchCard watch={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002d4e',
  },
  headerPlaceholder: {
    width: 40, // Same width as the back button for balanced layout
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#002d4e',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#002d4e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#002d4e',
    marginTop: 10,
    textAlign: 'center',
  },
});
