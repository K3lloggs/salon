import React, { useState, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { SortOption } from '../context/SortContext';
import { Watch } from '../types/Watch';
import ShareButton from './ShareButton';

interface FixedHeaderProps {
  title?: string;
  watch?: Watch;
  onBack?: () => void;
  showBackButton?: boolean;
  showSearch?: boolean;
  showFavorites?: boolean;
  showFilter?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFilterToggle?: () => void;
  currentScreen?: 'index' | 'brands' | 'newArrivals' | 'other';
}

function FixedHeaderComponent({
  title = "Watch Salon",
  watch,
  showBackButton = false,
  showSearch = false,
  showFavorites = false,
  showFilter = false,
  searchQuery = '',
  onSearchChange,
  onFilterToggle,
  onBack,
  currentScreen = 'other'
}: FixedHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInputText, setSearchInputText] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const [filterButtonLayout, setFilterButtonLayout] = useState(null);
  const currentPathRef = useRef(pathname);

  // Update search input text when prop changes
  React.useEffect(() => {
    setSearchInputText(searchQuery);
  }, [searchQuery]);

  // Track path changes
  React.useEffect(() => {
    if (pathname !== currentPathRef.current) {
      currentPathRef.current = pathname;
    }
  }, [pathname]);

  const handleTextChange = (text: string) => {
    setSearchInputText(text);
  };

  const handleClearSearch = () => {
    setSearchInputText('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleSearchSubmit = () => {
    if (onSearchChange && searchInputText !== searchQuery) {
      onSearchChange(searchInputText);
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleNavigation = (routePath: string) => {
    router.push(routePath as any);
  };

  const toggleFilter = () => {
    // Measure the filter button position before opening the dropdown
    if (!isFilterOpen && filterButtonRef.current) {
      filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setFilterButtonLayout({ x: pageX, y: pageY, width, height });
        setIsFilterOpen(true);
      });
    } else {
      setIsFilterOpen(!isFilterOpen);
    }
    
    if (onFilterToggle) {
      onFilterToggle();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left section with all buttons */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackNavigation}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color="#002d4e" />
            </TouchableOpacity>
          )}
          
          {showFavorites && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleNavigation('/favorites')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Favorites"
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark-outline" size={22} color="#002d4e" />
            </TouchableOpacity>
          )}

          {showFilter && (
            <TouchableOpacity
              ref={filterButtonRef}
              style={styles.iconButton}
              onPress={toggleFilter}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Filter options"
              accessibilityRole="button"
              accessibilityHint="Opens filter options dropdown"
              activeOpacity={0.7}
            >
              <Ionicons name="filter-outline" size={22} color="#002d4e" />
            </TouchableOpacity>
          )}
        </View>

        {/* Right section with search */}
        <View style={styles.rightSection}>
          {showSearch ? (
            <View style={styles.searchContainer}>
              <View style={styles.searchIconWrapper}>
                <Ionicons name="search" size={20} color="#002d4e" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by brand, model, complication"
                placeholderTextColor="#999"
                value={searchInputText}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoCapitalize="none"
                blurOnSubmit={false}
              />
              {searchInputText ? (
                <TouchableOpacity
                  style={styles.clearButtonWrapper}
                  onPress={handleClearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#002d4e" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          
          {watch && (
            <ShareButton
              title={`Check out this ${watch.brand} ${watch.model}`}
              message={`I found this amazing ${watch.brand} ${watch.model} on Watch Salon`}
              size={22}
              color="#002d4e"
              style={styles.iconButton}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const FixedHeader = memo(FixedHeaderComponent);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
    width: '100%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    height: 66, // Reduced height
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 8,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8, // Reduced padding
    marginRight: 6,
    borderRadius: 8, // Slightly reduced border radius
    height: 42, // Smaller height
    width: 42, // Smaller width
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: '#eaeaea',
      },
    }),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8, // Matching the buttons
    height: 42, // Matching the buttons
    marginRight: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: '#eaeaea',
      },
    }),
  },
  searchIconWrapper: {
    padding: 8,
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15, // Slightly smaller font
    color: '#333',
    ...Platform.select({
      android: {
        padding: 0,
      },
    }),
  },
  clearButtonWrapper: {
    padding: 8,
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});