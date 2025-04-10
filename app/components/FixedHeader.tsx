import React, { useState, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Platform,
  Image
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Watch } from '../types/Watch';
import ShareButton from './ShareButton';
import Colors from '../../constants/Colors';

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

  // Updated: clear parent search state when clearing input
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
              <Feather name="arrow-left" size={24} color={Colors.primaryBlue} />
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
              <Ionicons name="bookmark-outline" size={22} color={Colors.primaryBlue} />
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
              <Ionicons name="filter-outline" size={22} color={Colors.primaryBlue} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right section with search */}
        <View style={styles.rightSection}>
          {showSearch ? (
            <View style={styles.searchContainer}>
              <View style={styles.searchIconWrapper}>
                <Ionicons name="search" size={20} color={Colors.primaryBlue} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
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
                  <Ionicons name="close" size={20} color={Colors.primaryBlue} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          
          {watch && (
            <ShareButton
              watchId={watch.id}
              watchBrand={watch.brand}
              watchModel={watch.model}
              size={22}
              color={Colors.primaryBlue}
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
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
    backgroundColor: Colors.headerBg,
    height: 80, // Increased height to accommodate larger logo
    position: 'relative',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  logoImage: {
    height: 60, // Increased height for bigger logo
    width: 240, // Increased width for bigger logo
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 8,
    zIndex: 2,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  iconButton: {
    padding: 8,
    marginRight: 6,
    borderRadius: 8,
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.buttonBg,
    borderWidth: 1.5,
    borderColor: '#c0c0c0', // Added stronger border for contrast
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.buttonBg,
    borderRadius: 8,
    height: 42,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#c0c0c0', // Added stronger border for contrast
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
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
    fontSize: 15,
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