import React, { useState, memo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FixedHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showFavorites?: boolean;
  showFilter?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFilterToggle?: () => void;
}

function FixedHeaderComponent({
  title = "Watch Salon",
  showBackButton = false,
  showFavorites = false,
  showFilter = false,
  searchQuery = '',
  onSearchChange,
  onFilterToggle
}: FixedHeaderProps) {
  const router = useRouter();
  const [searchInputText, setSearchInputText] = useState(searchQuery);

  // Handle text change
  const handleTextChange = (text: string) => {
    setSearchInputText(text);
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchInputText('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (onSearchChange && searchInputText !== searchQuery) {
      onSearchChange(searchInputText);
    }
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left section with back button */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackNavigation}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={28} color="#002d4e" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar (now always visible and expanded) */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by brand, model, complication"
            placeholderTextColor="#999"
            value={searchInputText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchInputText ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          ) : (
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={22} color="#999" />
            </View>
          )}
        </View>

        {/* Right section with additional buttons */}
        <View style={styles.rightSection}>
          {showFavorites && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/favorites')}
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    height: 76,
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
    height: 46,
    width: 46,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    height: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: '#eaeaea',
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
        padding: 0,
      },
    }),
  },
  clearButton: {
    padding: 10,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconContainer: {
    padding: 10,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});