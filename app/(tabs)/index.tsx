import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Text, Platform } from "react-native";
import { FixedHeader } from "../components/FixedHeader";
import { WatchCard } from "../components/WatchCard";
import { FilterDropdown } from "../components/FilterButton";
import { useWatches } from "../hooks/useWatches";
import { useSortContext } from "../context/SortContext";
import { Watch } from "../types/Watch";

// Estimate item height for more accurate getItemLayout function
const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

export default function AllScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, loading, error } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Add a ref to track if this is the initial load
  const isInitialLoadRef = useRef(true);

  // Apply sorting if needed (memoized for performance)
  const sortedWatches = useMemo(() => {
    if (sortOption === 'highToLow') {
      return [...watches].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'lowToHigh') {
      return [...watches].sort((a, b) => a.price - b.price);
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
  }, [flatListRef]);

  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown(prev => !prev);
  }, []);

  const handleFilterSelect = useCallback((option: "lowToHigh" | "highToLow" | null) => {
    setSortOption(option);
    setShowFilterDropdown(false);
    scrollToTop();
  }, [setSortOption, scrollToTop]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Scroll to top whenever search query changes
    scrollToTop();
  }, [scrollToTop]);

  // Prevent scrolling to top on initial load
  useEffect(() => {
    // Skip the first render/load cycle
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    // Only scroll to top on subsequent data changes
    scrollToTop();
  }, [watches, scrollToTop]);

  // Optimize list rendering
  const renderItem = useCallback(
    ({ item }: { item: Watch }) => <WatchCard watch={item} />,
    []
  );

  const keyExtractor = useCallback((item: Watch) => item.id, []);

  // Optimize item layout calculation for smoother scrolling
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Always show the header even during loading
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 16,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  }
});