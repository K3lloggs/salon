import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
  useWindowDimensions,
  StyleProp, 
  ViewStyle,
  InteractionManager,
  Dimensions
} from "react-native";
import { FixedHeader } from "../components/FixedHeader";
import { WatchCard } from "../components/WatchCard";
import { FilterDropdown } from "../components/FilterButton";
import { useWatches } from "../hooks/useWatches";
import { useSortContext, SortOption } from "../context/SortContext";
import { Watch } from "../types/Watch";
import { useThemedStyles } from "../hooks/useThemedStyles";

const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

// Create a memoized WatchCard to prevent unnecessary re-renders
const MemoizedWatchCard = React.memo(WatchCard);

export default function AllScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const { 
    indexSortOption, 
    setIndexSortOption, 
    getSortedWatches 
  } = useSortContext();
  
  // Use indexSortOption for independent state
  const { watches, loading } = useWatches(searchQuery, indexSortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const { styles: themeStyles, colors } = useThemedStyles();
  const { width: windowWidth } = useWindowDimensions();
  
  // Determine number of columns based on screen width
  const numColumns = useMemo(() => {
    if (windowWidth < 600) return 1;
    if (windowWidth < 900) return 2;
    return 3;
  }, [windowWidth]);
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // ViewabilityConfig for optimizing rendering
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
  
  // Filter dropdown option selection handler - use screen-specific state
  const handleSortSelect = useCallback(
    (option: SortOption) => {
      setIndexSortOption(option);
      setShowFilterDropdown(false);
      
      // Scroll to top when sort option changes
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    },
    [setIndexSortOption]
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
  
  // Memoize column wrapper style for multi-column layout
  const columnWrapperStyle = useMemo(() => {
    return numColumns > 1
      ? ({
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        } as StyleProp<ViewStyle>)
      : undefined;
  }, [numColumns]);

  // Handle end reached for potential pagination
  const onEndReached = useCallback(() => {
    // Optional - implement pagination here if needed
  }, []);

  return (
    <View style={[styles.container, themeStyles.container]}>
      <FixedHeader
        showSearch={true}
        showFilter={true}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onFilterToggle={handleFilterToggle}
        showFavorites={true}
        currentScreen="index"
      />

      {showFilterDropdown && (
        <FilterDropdown 
          isVisible={true}
          onSelect={handleSortSelect} 
          currentSelection={indexSortOption}
          onClose={() => setShowFilterDropdown(false)}  
        />
      )}

      <FlatList
        ref={flatListRef}
        data={watches}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        columnWrapperStyle={columnWrapperStyle}
        key={`watchlist-${numColumns}-columns`} // Force re-render when columns change
        getItemLayout={getItemLayout}
        windowSize={3} // Reduced from 5 to 3 for better memory management
        maxToRenderPerBatch={3} // Reduced from 5 to 3
        initialNumToRender={2} // Reduced from 4 to 2
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.8} // Changed from 0.5 to 0.8 for earlier loading
        onEndReached={onEndReached}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        onMomentumScrollEnd={() => {
          // Cleanup any resources when scrolling stops
          if (Platform.OS === 'android') {
            if (global.gc) global.gc();
          }
        }}
        // For Android, improve scrolling performance
        // Removed invalid property for FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
});