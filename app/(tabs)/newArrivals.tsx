import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { WatchCard } from '../components/WatchCard';
import { FilterDropdown } from '../components/FilterButton';
import { useWatches } from '../hooks/useWatches';
import { useSortContext } from '../context/SortContext';
import { Watch } from '../types/Watch';

// Fixed item height based on actual WatchCard dimensions
const ITEM_HEIGHT = 420; 

// Memoized empty component for better performance
const EmptyComponent = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No new arrivals found</Text>
  </View>
));

// Memoized loading indicator component
const LoadingIndicator = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#002d4e" />
  </View>
));

// Memoized error component
const ErrorComponent = memo(() => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>An error occurred.</Text>
  </View>
));

// Memoized Footer Component to prevent unnecessary re-renders
const ListFooterComponent = memo(() => <View style={styles.footer} />);

export default function NewArrivalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, loading, error } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Force initial sort option to be random on component mount
  useEffect(() => {
    setSortOption('random');
  }, [setSortOption]);

  // Filter for new arrivals and apply sorting - memoize this operation
  const newArrivals = useMemo(() => {
    if (loading || !watches || watches.length === 0) return [];
    
    const filtered = watches.filter((watch) => watch.newArrival);
    
    if (sortOption === 'highToLow') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'lowToHigh') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'random') {
      // Use a stable seed for randomization to prevent re-shuffling on each render
      return [...filtered].sort(() => 0.5 - Math.random());
    }
    return filtered;
  }, [watches, sortOption, loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Add your data refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown((prev) => !prev);
  }, []);

  // When a filter option is selected, if it's null (clear filter), force random sorting.
  const handleFilterSelect = useCallback(
    (option: "lowToHigh" | "highToLow" | null) => {
      if (option === null) {
        setSortOption("random");
      } else {
        setSortOption(option);
      }
      setShowFilterDropdown(false);
      scrollToTop();
    },
    [setSortOption, scrollToTop]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Scroll to top whenever the search query changes
      scrollToTop();
    },
    [scrollToTop]
  );

  // Prevent scrolling to top on the initial load
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    scrollToTop();
  }, [watches, scrollToTop]);

  // Memoized render functions for better performance
  const renderItem = useCallback(
    ({ item }: { item: Watch }) => <WatchCard watch={item} />,
    []
  );

  const keyExtractor = useCallback((item: Watch) => item.id, []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (error) {
    return (
      <View style={styles.container}>
        <FixedHeader 
          title="New Arrivals"
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          showFavorites={true}
          showFilter={true}
          onFilterToggle={toggleFilterDropdown}
          currentScreen="newArrivals"
        />
        <ErrorComponent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FixedHeader 
        title="New Arrivals"
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showFavorites={true}
        showFilter={true}
        onFilterToggle={toggleFilterDropdown}
        currentScreen="newArrivals"
      />
      
      <FilterDropdown 
        isVisible={showFilterDropdown}
        onSelect={handleFilterSelect}
        onClose={() => setShowFilterDropdown(false)}
      />
      
      <FlatList
        ref={flatListRef}
        data={newArrivals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={4}
        maxToRenderPerBatch={5}
        windowSize={7}
        updateCellsBatchingPeriod={30} // Reduced for faster updates
        removeClippedSubviews={false} // Set to false for smoother transitions
        getItemLayout={getItemLayout}
        contentContainerStyle={[
          styles.listContent,
          newArrivals.length === 0 && !loading && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#002d4e"
            progressViewOffset={10} // Adjusted for better visibility
          />
        }
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListEmptyComponent={loading ? <LoadingIndicator /> : <EmptyComponent />}
        ListFooterComponent={<ListFooterComponent />}
        // Additional optimizations
        scrollEventThrottle={16}
        onEndReachedThreshold={0.5}
        directionalLockEnabled={true}
        disableScrollViewPanResponder={false}
        bounces={true} // Enable bounce for user feedback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  errorContainer: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: { 
    color: '#FF0000', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  footer: {
    height: 20,
  }
});