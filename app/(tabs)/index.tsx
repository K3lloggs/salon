import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Platform } from "react-native";
import { FixedHeader } from "../components/FixedHeader";
import { WatchCard } from "../components/WatchCard";
import { FilterDropdown } from "../components/FilterButton";
import { useWatches } from "../hooks/useWatches";
import { useSortContext, SortOption } from "../context/SortContext";
import { Watch } from "../types/Watch";

const ITEM_HEIGHT = 420; // Adjusted based on card dimensions and margins

export default function AllScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { sortOption, setSortOption } = useSortContext();
  const { watches, loading } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Add a ref to track if this is the initial load (for scrolling)
  const isInitialLoadRef = useRef(true);

  // Force initial sort option to be random on component mount
  useEffect(() => {
    setSortOption('random');
  }, [setSortOption]);

  // Apply sorting based on sortOption (memoized for performance)
  const sortedWatches = useMemo(() => {
    if (sortOption === 'highToLow') {
      return [...watches].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'lowToHigh') {
      return [...watches].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'mostLiked') {
      // Sort by most likes (highest to lowest)
      return [...watches].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortOption === 'leastLiked') {
      // Sort by least likes (lowest to highest)
      return [...watches].sort((a, b) => (a.likes || 0) - (b.likes || 0));
    } else if (sortOption === 'random') {
      // Always randomize the order
      return [...watches].sort(() => Math.random() - 0.5);
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
    (option: SortOption) => {
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
        showFavorites={true}
        showSearch={true}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        showFilter={true}
        onFilterToggle={toggleFilterDropdown}
        currentScreen="index"
      />
      <FlatList
        ref={flatListRef}
        data={sortedWatches}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={5}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#002d4e"]}
            tintColor="#002d4e"
          />
        }
      />

      {showFilterDropdown && (
        <FilterDropdown
          isVisible={showFilterDropdown}
          onSelect={handleFilterSelect}
          onClose={() => setShowFilterDropdown(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 0,
    alignItems: "center",
  },
});