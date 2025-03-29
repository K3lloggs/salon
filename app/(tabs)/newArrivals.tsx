import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  Platform,
} from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { WatchCard } from '../components/WatchCard';
import { FilterDropdown } from '../components/FilterButton';
import { useWatches } from '../hooks/useWatches';
import { useSortContext } from '../context/SortContext';
import { Watch } from '../types/Watch';

const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

// Create a memoized WatchCard to prevent unnecessary re-renders
const MemoizedWatchCard = React.memo(WatchCard);

export default function NewArrivalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, error, loading } = useWatches(searchQuery);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Ref for stable random sorting
  const randomOrderRef = useRef<Watch[] | null>(null);
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Force default sort to random on mount.
  useEffect(() => {
    setSortOption("random");
  }, [setSortOption]);

  // Filter for new arrivals and apply sorting based on sortOption with stable random sorting
  const newArrivals = useMemo(() => {
    const arrivals = watches.filter((watch) => watch.newArrival);
    if (arrivals.length === 0) return [];
    
    if (sortOption === 'random') {
      if (!randomOrderRef.current || randomOrderRef.current.length !== arrivals.length) {
        randomOrderRef.current = [...arrivals].sort(() => Math.random() - 0.5);
      }
      return randomOrderRef.current;
    } else {
      // Clear the random order when a different sort option is selected
      randomOrderRef.current = null;
      
      if (sortOption === 'highToLow') {
        return [...arrivals].sort((a, b) => b.price - a.price);
      } else if (sortOption === 'lowToHigh') {
        return [...arrivals].sort((a, b) => a.price - b.price);
      }
    }
    return arrivals;
  }, [watches, sortOption]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Optimize item layout calculation for smoother scrolling.
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // Prevent scrolling to top on the initial load
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    scrollToTop();
  }, [watches, scrollToTop]);

  // Memoize renderItem to avoid unnecessary re-renders.
  const renderItem = useCallback(({ item }: { item: Watch }) => (
    <MemoizedWatchCard watch={item} />
  ), []);

  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown((prev) => !prev);
  }, []);

  // When a filter option is selected, if the option is null, force random sorting.
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

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Scroll to top whenever the search query changes
    scrollToTop();
  }, [scrollToTop]);

  const keyExtractor = useCallback((item: Watch) => item.id, []);

  return (
    <View style={styles.container}>
      <FixedHeader 
        title="New Arrivals"
        showSearch={true}
        showFavorites={true}
        showFilter={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFilterToggle={toggleFilterDropdown}
        currentScreen="newArrivals"
      />
      
      <FilterDropdown 
        isVisible={showFilterDropdown}
        onSelect={handleFilterSelect}
        onClose={() => setShowFilterDropdown(false)}
      />
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>An error occurred.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={loading ? [] : newArrivals}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#002d4e" 
            />
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 20, // Added for better position maintenance
          }}
        />
      )}
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
    alignItems: 'center' 
  },
  errorText: { 
    color: '#FF0000', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  }
});