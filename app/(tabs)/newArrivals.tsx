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

export default function NewArrivalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, loading, error } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Force initial sort option to be random on component mount
  useEffect(() => {
    setSortOption('random');
  }, [setSortOption]);

  // Filter for new arrivals and apply sorting - memoize this operation
  const newArrivals = useMemo(() => {
    const filtered = watches.filter((watch) => watch.newArrival);
    
    if (sortOption === 'highToLow') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'lowToHigh') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'random') {
      // Note: Consider if you really need to randomize on every render
      return [...filtered].sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [watches, sortOption]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
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
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#002d4e" />
          }
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
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