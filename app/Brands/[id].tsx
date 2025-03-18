import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WatchCard } from '../components/WatchCard';
import { useWatches } from '../hooks/useWatches';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/BackButton'; // Import your BackButton component

function BrandDetailHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      {/* Left side: Back button */}
      <View style={styles.headerLeft}>
        <BackButton />
      </View>

      {/* Center: Brand name */}
      <Text style={styles.headerTitle}>{title}</Text>

      {/* Right side: Empty placeholder for balanced layout */}
      <View style={styles.headerRight} />
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Use the header component with the back button */}
      <BrandDetailHeader title={brandName} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002d4e" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Error loading {brandName} watches.
          </Text>
          <View style={styles.retryButton}>
            <Text style={styles.retryButtonText} onPress={handleRefresh}>Retry</Text>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002d4e',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
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