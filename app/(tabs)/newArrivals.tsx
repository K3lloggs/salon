import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  Platform,
  InteractionManager,
  Dimensions,
} from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { WatchCard } from '../components/WatchCard';
import { FilterDropdown } from '../components/FilterButton';
import { useWatches } from '../hooks/useWatches';
import { useSortContext } from '../context/SortContext';
import { Watch } from '../types/Watch';
import { useThemedStyles } from '../hooks/useThemedStyles';

const ITEM_HEIGHT = 420;
const MemoizedWatchCard = React.memo(WatchCard);

/*───────────────────────────────────────────────────────────────
  Cast ANY “date-ish” value to a millisecond number.
  Works with string | number | Date | Firestore.Timestamp | undefined.
  Keeping the unsafe stuff **inside** this helper avoids TS 2769 errors.
────────────────────────────────────────────────────────────────*/
const toTimestamp = (d: unknown): number => {
  if (!d) return 0;

  if (d instanceof Date) return d.getTime();

  // Firestore Timestamp { seconds: number, nanoseconds: number }
  if (
    typeof d === 'object' &&
    d !== null &&
    'seconds' in d &&
    typeof (d as any).seconds === 'number'
  ) {
    return (d as any).seconds * 1_000;
  }

  if (typeof d === 'number') return d;

  if (typeof d === 'string') {
    const parsed = Date.parse(d);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Any other shape → treat as epoch-0 so it sorts last
  return 0;
};

export default function NewArrivalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);

  const { sortOption, setSortOption } = useSortContext();
  const { watches: allWatches, loading } = useWatches(searchQuery, sortOption);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList<Watch>>(null);
  const { styles: themeStyles, colors } = useThemedStyles();
  const isInitialLoadRef = useRef(true);

  /*────────────────────  lifecycle  ────────────────────*/
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      InteractionManager.runAfterInteractions(() => setIsInteractionComplete(true));
    }

    const sub = Dimensions.addEventListener('change', () => {
      setTimeout(() => flatListRef.current?.scrollToOffset({ animated: false, offset: 0 }), 100);
    });
    return () => sub.remove();
  }, []);

  /*────────────────────  data  ────────────────────*/
  const newArrivals = useMemo(() => {
    return (
      allWatches
        .filter(w => w.newArrival)                         // keep only “New Arrival”
        .sort((a, b) => toTimestamp(b.dateAdded) -         // newest → oldest
          toTimestamp(a.dateAdded))
    );
  }, [allWatches]);

  const showEmptyState = !loading && newArrivals.length === 0;

  /*────────────────────  handlers  ────────────────────*/
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 750);
  }, []);

  const handleFilterToggle = useCallback(() => setShowFilterDropdown(prev => !prev), []);
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, []);

  const handleSortSelect = useCallback(
    (option) => {
      setSortOption(option);
      setShowFilterDropdown(false);
      flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    },
    [setSortOption],
  );

  /*────────────────────  FlatList helpers  ────────────────────*/
  const keyExtractor = useCallback((item: Watch) => `watch-${item.id}`, []);
  const renderItem = useCallback(
    ({ item }: { item: Watch }) => <MemoizedWatchCard watch={item} />,
    [],
  );
  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50, minimumViewTime: 300 }),
    [],
  );
  const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged: () => { } }]);

  /*────────────────────  render  ────────────────────*/
  return (
    <View style={[styles.container, themeStyles.container]}>
      <FixedHeader
        showSearch
        showFilter
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onFilterToggle={handleFilterToggle}
        showFavorites
        currentScreen="newArrivals"
      />

      {showFilterDropdown && (
        <FilterDropdown
          isVisible
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
          showEmptyState && styles.emptyListContent,
        ]}
        getItemLayout={getItemLayout}
        windowSize={3}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
        {...(Platform.OS === 'android' ? { updateCellsBatchingPeriod: 50 } : {})}
        onMomentumScrollEnd={() => {
          if (Platform.OS === 'android' && global.gc) global.gc();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          showEmptyState ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No new arrivals found at this time.
              </Text>
              <Text style={[styles.emptySubText, { color: colors.lightText }]}>
                Please check back soon for new inventory!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

/*────────────────────  styles  ────────────────────*/
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  emptySubText: { fontSize: 14, textAlign: 'center' },
});
