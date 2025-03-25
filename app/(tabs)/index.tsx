import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Platform } from "react-native";
import { FixedHeader } from "../components/FixedHeader";
import { WatchCard } from "../components/WatchCard";
import { FilterDropdown } from "../components/FilterButton";
import { useWatches } from "../hooks/useWatches";
import { useSortContext, SortOption } from "../context/SortContext";
import { Watch } from "../types/Watch";

const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

// Create a memoized WatchCard to prevent unnecessary re-renders
const MemoizedWatchCard = React.memo(WatchCard);

export default function AllScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, loading } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Ref for stable random sorting
  const randomOrderRef = useRef<Watch[] | null>(null);
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Force initial sort option to be random on component mount
  useEffect(() => {
    setSortOption('random');
  }, [setSortOption]);

  // Apply sorting based on sortOption with stable random sorting
  const sortedWatches = useMemo(() => {
    if (!watches || watches.length === 0) return [];
    
    if (sortOption === 'random') {
      if (!randomOrderRef.current || randomOrderRef.current.length !== watches.length) {
        randomOrderRef.current = [...watches].sort(() => Math.random() - 0.5);
      }
      return randomOrderRef.current;
    } else {
      // Clear the random order when a different sort option is selected
      randomOrderRef.current = null;
      
      if (sortOption === 'highToLow') {
        return [...watches].sort((a, b) => b.price - a.price);
      } else if (sortOption === 'lowToHigh') {
        return [...watches].sort((a, b) => a.price - b.price);
      } else if (sortOption === 'mostLiked') {
        return [...watches].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sortOption === 'leastLiked') {
        return [...watches].sort((a, b) => (a.likes || 0) - (b.likes || 0));
      }
    }
    return watches;
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
    ({ item }: { item: Watch }) => <MemoizedWatchCard watch={item} />,
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
        title="Watch Salon"
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showFavorites={true}
        showFilter={true}
        onFilterToggle={toggleFilterDropdown}
        currentScreen="index"
      />
      
      <FilterDropdown 
        isVisible={showFilterDropdown}
        onSelect={handleFilterSelect}
        onClose={() => setShowFilterDropdown(false)}
      />
      
      <FlatList
        ref={flatListRef}
        data={loading ? [] : sortedWatches}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={8} // Increased for smoother scrolling
        maxToRenderPerBatch={8} // Increased for smoother scrolling
        windowSize={9} // Increased for more offscreen rendering
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'} // Not on iOS for smoother transitions
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#002d4e" 
          />
        }
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 20, // Added for better position maintenance
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  }
});