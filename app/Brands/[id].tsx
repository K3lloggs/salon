import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WatchCard } from '../components/WatchCard';
import { useWatches } from '../hooks/useWatches';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import { useTheme } from '../context/ThemeContext';
import { FilterDropdown } from '../components/FilterButton';
import { useSortContext, SortOption } from '../context/SortContext';

// Custom back button component with theme support
function ThemedBackButton() {
  const { isDark } = useTheme();
  const router = useRouter();
  
  // Set icon color to white in dark mode
  const iconColor = isDark ? '#FFF' : '#002d4e';
  const buttonBackgroundColor = isDark ? '#333' : '#f9f9f9';
  const buttonBorderColor = isDark ? '#555' : '#c0c0c0';
  
  return (
    <TouchableOpacity 
      style={[styles.backButton, { backgroundColor: buttonBackgroundColor, borderColor: buttonBorderColor }]}
      onPress={() => router.back()}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={22} color={iconColor} />
    </TouchableOpacity>
  );
}

function BrandDetailHeader({ 
  title, 
  onFilterPress 
}: { 
  title: string;
  onFilterPress: () => void;
}) {
  const { isDark } = useTheme();
  
  // Dark mode styles
  const backgroundColor = isDark ? '#222' : '#FFF';
  const textColor = isDark ? '#FFF' : '#002d4e';
  const borderColor = isDark ? '#444' : '#f0f0f0';
  const iconColor = isDark ? '#81b0ff' : '#002d4e';
  const buttonBackgroundColor = isDark ? '#333' : '#f9f9f9';
  const buttonBorderColor = isDark ? '#555' : '#c0c0c0';
  
  return (
    <View style={[styles.header, { backgroundColor, borderBottomColor: borderColor }]}>
      {/* Left side: Back button */}
      <View style={styles.headerLeft}>
        <ThemedBackButton />
      </View>

      {/* Center: Brand name */}
      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>

      {/* Right side: Filter button */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: buttonBackgroundColor, borderColor: buttonBorderColor }]}
          onPress={onFilterPress}
          accessibilityLabel="Filter options"
          accessibilityRole="button"
        >
          <Ionicons name="filter-outline" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BrandDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { sortOption, setSortOption, getSortedWatches } = useSortContext();
  
  // Retrieve the clicked brand name from route parameters
  const brandName =
    typeof params.brandName === 'string' ? params.brandName : '';
  const { watches, loading, error } = useWatches();
  const [refreshing, setRefreshing] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Dark mode styles
  const backgroundColor = isDark ? '#121212' : '#FFFFFF';
  const textColor = isDark ? '#FFF' : '#002d4e';
  const highlightColor = isDark ? '#81b0ff' : '#002d4e';
  const buttonBackgroundColor = isDark ? '#333' : '#002d4e';
  const buttonTextColor = isDark ? '#FFF' : '#FFFFFF';

  // Filter watches by brand (case insensitive)
  const filteredWatches = useMemo(() => {
    const brandWatches = watches.filter(
      (watch) => watch.brand.toLowerCase() === brandName.toLowerCase()
    );
    
    // Apply the current sort option
    return getSortedWatches(brandWatches, sortOption);
  }, [brandName, watches, sortOption, getSortedWatches]);

  // Start animation when data is loaded
  useEffect(() => {
    if (!loading && watches.length > 0) {
      const timeoutId = setTimeout(() => {
        setContentReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, watches, fadeAnim]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Replace with your actual refresh logic
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Toggle filter dropdown
  const handleFilterToggle = useCallback(() => {
    setShowFilterDropdown(!showFilterDropdown);
  }, [showFilterDropdown]);

  // Handle filter selection
  const handleFilterSelect = useCallback((option: SortOption) => {
    setSortOption(option);
    setShowFilterDropdown(false);
  }, [setSortOption]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header with back button and filter button */}
      <BrandDetailHeader 
        title={brandName} 
        onFilterPress={handleFilterToggle} 
      />

      {/* Filter dropdown */}
      {showFilterDropdown && (
        <FilterDropdown 
          isVisible={true}
          onSelect={handleFilterSelect} 
          currentSelection={sortOption}
          onClose={() => setShowFilterDropdown(false)}  
        />
      )}

      {loading || !contentReady ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={highlightColor} />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {error ? (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: textColor }]}>
                Error loading {brandName} watches.
              </Text>
              <View style={[styles.retryButton, { backgroundColor: buttonBackgroundColor }]}>
                <Text style={[styles.retryButtonText, { color: buttonTextColor }]} onPress={handleRefresh}>
                  Retry
                </Text>
              </View>
            </View>
          ) : filteredWatches.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="watch-outline" size={70} color={highlightColor} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
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
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  filterButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
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
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});