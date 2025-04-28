import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  Platform,
  InteractionManager,
  Dimensions
} from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { WatchCard } from '../components/WatchCard';
import { FilterDropdown } from '../components/FilterButton';
import { useWatches } from '../hooks/useWatches';
import { useSortContext } from '../context/SortContext';
import { Watch } from '../types/Watch';
import { useThemedStyles } from '../hooks/useThemedStyles';

const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

// Create a memoized WatchCard to prevent unnecessary re-renders
const MemoizedWatchCard = React.memo(WatchCard);

export default function NewArrivalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  
  const { sortOption, setSortOption } = useSortContext();
  const { watches: allWatches, loading } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const { styles: themeStyles, colors } = useThemedStyles();
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Initialize on component mount
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      
      // Defer heavy operations until after interactions
      InteractionManager.runAfterInteractions(() => {
        setIsInteractionComplete(true);
      });
    }
    
    // Handle dimension changes
    const subscription = Dimensions.addEventListener('change', () => {
      // Allow time for layout to settle after orientation change
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
        }
      }, 100);
    });
    
    return () => subscription.remove();
  }, []);

  // Filter watches to include only new arrivals
  const newArrivals = useMemo(() => {
    return allWatches.filter(watch => 
      watch.newArrival === true
    );
  }, [allWatches]);

  // Provide a fallback message when no new arrivals are found
  const showEmptyState = !loading && (!newArrivals || newArrivals.length === 0);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate a reload of watch data with a delay
    setTimeout(() => {
      setRefreshing(false);
    }, 750);
  }, []);

  // Filter toggle callback for header
  const handleFilterToggle = useCallback(() => {
    setShowFilterDropdown(!showFilterDropdown);
  }, [showFilterDropdown]);

  // Handle search query changes from the header search input
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Reset to top when search changes
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  }, []);
  
  // Filter dropdown option selection handler
  const handleSortSelect = useCallback(
    (option) => {
      setSortOption(option);
      setShowFilterDropdown(false);
      
      // Scroll to top when sort option changes
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    },
    [setSortOption]
  );

  // FlatList optimizations - memoize key extractor and item renderer
  const keyExtractor = useCallback((item: Watch) => `watch-${item.id}`, []);

  const renderItem = useCallback(
    ({ item }: { item: Watch }) => (
      <MemoizedWatchCard watch={item} />
    ),
    []
  );

  // Calculate item layout ahead of time for better FlatList performance
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Set up viewability configuration for better rendering
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }), []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig,
      onViewableItemsChanged: ({ viewableItems, changed }) => {
        // Optional logging to debug visibility issues
        // console.log('Visible items:', viewableItems.map(item => item.item.id));
      },
    },
  ]);
  
  // Handle reaching the end of the list
  const onEndReached = useCallback(() => {
    // Optional - implement pagination here if needed
  }, []);

  // Empty component to show when no new arrivals are found
  const EmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No new arrivals found at this time.
      </Text>
      <Text style={[styles.emptySubText, { color: colors.lightText }]}>
        Please check back soon for new inventory!
      </Text>
    </View>
  ), [colors]);

  return (
    <View style={[styles.container, themeStyles.container]}>
      <FixedHeader
        showSearch={true}
        showFilter={true}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onFilterToggle={handleFilterToggle}
        showFavorites={true}
        currentScreen="newArrivals"
      />

      {showFilterDropdown && (
        <FilterDropdown 
          isVisible={true}
          onSelect={handleSortSelect} 
          currentSelection={sortOption}
          onClose={() => setShowFilterDropdown(false)}  
        />
      )}

      <FlatList
        ref={flatListRef}
        data={newArrivals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          showEmptyState && styles.emptyListContent
        ]}
        getItemLayout={getItemLayout}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={4}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        // For Android, improve scrolling performance
        {...(Platform.OS === 'android' ? { updateCellsBatchingPeriod: 50 } : {})}
        onMomentumScrollEnd={() => {
          // Cleanup any resources when scrolling stops
          if (Platform.OS === 'android') {
            if (global.gc) global.gc();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={showEmptyState ? EmptyComponent : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
});