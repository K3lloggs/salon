import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ListRenderItemInfo,
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
  const { watches, error } = useWatches(searchQuery, sortOption);
  const flatListRef = useRef<FlatList>(null);

  // Cache the new arrivals list and memoize for performance
  const newArrivals = useMemo(() => {
    const arrivals = watches.filter((watch) => watch.newArrival);
    if (sortOption === 'highToLow') {
      return [...arrivals].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'lowToHigh') {
      return [...arrivals].sort((a, b) => a.price - b.price);
    } else {
      // When sortOption is 'random' (or cleared), randomize the order
      return [...arrivals].sort(() => Math.random() - 0.5);
    }
  }, [watches, sortOption]);

  // Optimize item layout calculation for smoother scrolling
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoize the render function to prevent unnecessary rerenders
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Watch>) => (
    <WatchCard watch={item} />
  ), []);

  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [flatListRef]);

  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown((prev) => !prev);
  }, []);

  // Update filter selection to force random sorting if cleared (null)
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
  }, []);

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
          data={newArrivals}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No new arrivals found.</Text>
            </View>
          }
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  }
});
