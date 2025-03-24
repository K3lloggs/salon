import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Platform, 
  Image,
  InteractionManager
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import ShareButton from './ShareButton';
import { Watch } from '../types/Watch';

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

const AnimatedImage = Animated.createAnimatedComponent(Image);

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
  currentScreen = 'other'
}: FixedHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchInputText, setSearchInputText] = useState(searchQuery);
  const searchWidth = useRef(new Animated.Value(0)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const windowWidth = Dimensions.get('window').width;
  const currentPathRef = useRef(pathname);
  
  // Set up navigating refs instead of state to avoid re-renders
  const isNavigatingRef = useRef(false);
  const navigatingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update search input text when prop changes
  useEffect(() => {
    setSearchInputText(searchQuery);
  }, [searchQuery]);

  // Track path changes for transition handling
  useEffect(() => {
    if (pathname !== currentPathRef.current) {
      // Path has changed, but don't update state or re-render
      currentPathRef.current = pathname;
      
      // Clear any existing timers
      if (navigatingTimerRef.current) {
        clearTimeout(navigatingTimerRef.current);
      }
    }
  }, [pathname]);

  // Animate logo on mount
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1.05,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const toggleSearch = () => {
    if (!isSearchActive) {
      // Expand search - width animations MUST use useNativeDriver: false
      setIsSearchActive(true);

      Animated.parallel([
        Animated.spring(searchWidth, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: false // Width changes CANNOT use native driver
        }),
        Animated.timing(searchOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        })
      ]).start(() => {
        searchInputRef.current?.focus();
      });
    } else {
      // If the search is active and the user has entered text
      if (searchInputText) {
        // Clear search
        setSearchInputText('');
        if (onSearchChange) {
          onSearchChange('');
        }
      } else {
        // Collapse search (only when empty)
        Animated.parallel([
          Animated.spring(searchWidth, {
            toValue: 0,
            friction: 8,
            tension: 50,
            useNativeDriver: false // Width changes CANNOT use native driver
          }),
          Animated.timing(searchOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false
          })
        ]).start(() => {
          setIsSearchActive(false);
        });
      }
    }
  };

  // Optimized navigation methods to prevent button lag
  const handleNavigation = (routePath: string) => {
    // Schedule navigation after current touch interaction completes
    InteractionManager.runAfterInteractions(() => {
      router.push(routePath as any);
    });
  };

  const handleBackNavigation = () => {
    InteractionManager.runAfterInteractions(() => {
      router.back();
    });
  };

  const handleSearchSubmit = () => {
    if (onSearchChange && searchInputText !== searchQuery) {
      onSearchChange(searchInputText);
    }
  };

  // Calculate maximum width based on current buttons
  const buttonSpace = (showFavorites ? 56 : 0) + (showFilter ? 56 : 0) + (watch ? 56 : 0) + 90;
  const maxSearchWidth = windowWidth - buttonSpace;

  const animatedSearchWidth = searchWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [45, maxSearchWidth]
  });

  const logoStyle = {
    transform: [{ scale: logoScale }]
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackNavigation}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={28} color="#002d4e" />
            </TouchableOpacity>
          ) : (
            <Animated.View style={styles.logoContainer}>
              <Animated.Image
                source={require('../../assets/images/shrevecrumplow_logo_1.png')}
                style={[styles.logo, logoStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.rightSection}>
          {showSearch && (
            <Animated.View style={[styles.searchContainer, { width: animatedSearchWidth }]}>
              <Animated.View style={{ flex: 1, opacity: searchOpacity }}>
                {isSearchActive && (
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="#999"
                    value={searchInputText}
                    onChangeText={setSearchInputText}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    autoCapitalize="none"
                    blurOnSubmit={false}
                  />
                )}
              </Animated.View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  if (isSearchActive && searchInputText) {
                    if (searchInputText !== searchQuery) {
                      handleSearchSubmit();
                    } else {
                      setSearchInputText('');
                      if (onSearchChange) onSearchChange('');
                    }
                  } else {
                    toggleSearch();
                  }
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSearchActive && searchInputText ? (searchInputText === searchQuery ? "close" : "search") : "search"}
                  size={26}
                  color="#002d4e"
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {showFavorites && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleNavigation('/favorites')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Favorites"
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark-outline" size={26} color="#002d4e" />
            </TouchableOpacity>
          )}

          {showFilter && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onFilterToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Filter options"
              accessibilityRole="button"
              accessibilityHint="Opens filter options dropdown"
              activeOpacity={0.7}
            >
              <Ionicons name="filter-outline" size={26} color="#002d4e" />
            </TouchableOpacity>
          )}

          {watch && (
            <ShareButton
              title={`Check out this ${watch.brand} ${watch.model}`}
              message={`I found this amazing ${watch.brand} ${watch.model} on Watch Salon`}
              size={26}
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
    zIndex: 10, // Ensure header is above other content
    width: '100%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    height: 76, // Increased height for better visibility
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    height: '100%',
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: 'transparent', // Ensure transparent background for Android
    overflow: 'hidden', // Clip any shadows to prevent gray background on Android
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'transparent', // Ensure transparent background for logo
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0, // Remove elevation to prevent gray background
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002d4e',
    flex: 1,
    textAlign: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 12,
    marginLeft: 6,
    borderRadius: 10,
    height: 50,
    width: 50,
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
        elevation: 0, // Remove elevation to prevent shadow effect
        borderWidth: 1,
        borderColor: '#eaeaea', // Light border instead of shadow
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 6,
    height: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 0, // Remove elevation
        borderWidth: 1,
        borderColor: '#eaeaea', // Light border instead of shadow
      },
    }),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      android: {
        padding: 0, // Remove default padding on Android
      },
    }),
  },
});