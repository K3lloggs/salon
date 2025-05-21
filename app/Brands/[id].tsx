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
  ActivityIndicator,
  Text,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WatchCard } from '../components/WatchCard';
import { useWatches } from '../hooks/useWatches';
import { useTheme } from '../context/ThemeContext';
import { FilterDropdown } from '../components/FilterButton';
import { useSortContext, SortOption } from '../context/SortContext';

/* ──────────────────────────── constants ─────────────────────────── */

const STATUS_HEIGHT =
  Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

/* ───────────────────────── back-button ─────────────────────────── */

function ThemedBackButton() {
  const { isDark } = useTheme();
  const router = useLocalSearchParams() as any;

  return (
    <TouchableOpacity
      style={[
        styles.backButton,
        {
          backgroundColor: isDark ? '#333' : '#f9f9f9',
          borderColor: isDark ? '#555' : '#c0c0c0',
        },
      ]}
      onPress={() => router.back?.()}
      accessibilityRole="button"
    >
      <Ionicons
        name="arrow-back"
        size={22}
        color={isDark ? '#FFF' : '#002d4e'}
      />
    </TouchableOpacity>
  );
}

/* ────────────────────────── header ────────────────────────────── */

function BrandDetailHeader({
  title,
  onFilterPress,
}: {
  title: string;
  onFilterPress: () => void;
}) {
  const { isDark } = useTheme();

  const headerBg = isDark ? '#222' : '#FFF';
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  useEffect(() => {
    StatusBar.setBarStyle(statusBarStyle);
  }, [statusBarStyle]);

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: headerBg,
          borderBottomWidth: isDark ? 0 : 1,
          borderBottomColor: isDark ? 'transparent' : '#f0f0f0',
          paddingTop: Platform.OS === 'android' ? STATUS_HEIGHT : 0,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <ThemedBackButton />
      </View>

      <Text
        style={[
          styles.headerTitle,
          { color: isDark ? '#FFF' : '#002d4e' },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: isDark ? '#333' : '#f9f9f9',
              borderColor: isDark ? '#555' : '#c0c0c0',
            },
          ]}
          onPress={onFilterPress}
          accessibilityRole="button"
        >
          <Ionicons
            name="filter-outline"
            size={22}
            color={isDark ? '#81b0ff' : '#002d4e'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────────────────────── main screen ───────────────────────── */

export default function BrandDetailScreen() {
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const { sortOption, setSortOption, getSortedWatches } = useSortContext();

  const brandName =
    typeof params.brandName === 'string' ? params.brandName : '';

  const { watches, loading, error } = useWatches();
  const [refreshing, setRefreshing] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* colours */
  const headerBg = isDark ? '#222' : '#FFF';
  const bodyBg = isDark ? '#121212' : '#FFFFFF';
  const textColor = isDark ? '#FFF' : '#002d4e';
  const accent = isDark ? '#81b0ff' : '#002d4e';

  /* filter + sort */
  const filtered = useMemo(() => {
    return getSortedWatches(
      watches.filter(
        (w) => w.brand.toLowerCase() === brandName.toLowerCase(),
      ),
      sortOption,
    );
  }, [watches, brandName, sortOption, getSortedWatches]);

  /* fade-in */
  useEffect(() => {
    if (!loading && watches.length) {
      const to = setTimeout(() => {
        setContentReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 80);
      return () => clearTimeout(to);
    }
  }, [loading, watches, fadeAnim]);

  /* handlers */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleFilterToggle = useCallback(
    () => setShowFilterDropdown((s) => !s),
    [],
  );

  const handleFilterSelect = useCallback(
    (opt: SortOption) => {
      setSortOption(opt);
      setShowFilterDropdown(false);
    },
    [setSortOption],
  );

  /* ─────────────────────── render ─────────────────────── */

  return (
    <View style={[styles.flex, { backgroundColor: headerBg }]}>
      <SafeAreaView style={[styles.flex, { backgroundColor: headerBg }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <BrandDetailHeader
          title={brandName}
          onFilterPress={handleFilterToggle}
        />

        {showFilterDropdown && (
          <FilterDropdown
            isVisible
            currentSelection={sortOption}
            onSelect={handleFilterSelect}
            onClose={() => setShowFilterDropdown(false)}
          />
        )}

        {/* body */}
        <View style={[styles.flex, { backgroundColor: bodyBg }]}>
          {loading || !contentReady ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={accent} />
            </View>
          ) : (
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
              {error ? (
                <View style={styles.center}>
                  <Text style={[styles.error, { color: textColor }]}>
                    Error loading {brandName} watches.
                  </Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons
                    name="watch-outline"
                    size={70}
                    color={accent}
                  />
                  <Text style={[styles.empty, { color: textColor }]}>
                    No {brandName} Watches Available
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  renderItem={({ item }) => (
                    <WatchCard watch={item} />
                  )}
                  keyExtractor={(it) => it.id}
                  contentContainerStyle={styles.listPad}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ───────────────────────── styles ───────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { width: 40 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },

  backButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  filterButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPad: { paddingBottom: 20 },
  error: { fontSize: 16, textAlign: 'center', marginBottom: 12 },
  empty: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});
