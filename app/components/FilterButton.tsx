import React, { useState, useRef, useEffect, memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortOption } from '../context/SortContext';

interface FilterDropdownProps {
  isVisible: boolean;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
  filterButtonLayout?: { x: number; y: number; width: number; height: number };
}

function FilterDropdownComponent({ 
  isVisible, 
  onSelect, 
  onClose,
  filterButtonLayout 
}: FilterDropdownProps) {
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;
  
  useEffect(() => {
    if (isVisible) {
      // Animate backdrop and dropdown together
      Animated.parallel([
        Animated.spring(dropdownAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(dropdownAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible, dropdownAnim, backdropAnim]);

  const handleSelectOption = (option: SortOption) => {
    onSelect(option);
  };

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
    opacity: dropdownAnim,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-15, 0],
        }),
      },
      {
        scale: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  const backdropStyle = {
    opacity: backdropAnim,
  };

  if (!isVisible) return null;

  // Calculate dropdown position based on filter button layout
  const dropdownPosition = {
    // If we have the filter button's layout, position the dropdown above it
    // with its left edge aligned with the button's left edge
    top: filterButtonLayout ? filterButtonLayout.y + filterButtonLayout.height + 4 : 66,
    left: filterButtonLayout ? filterButtonLayout.x : 16
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.backdrop, backdropStyle]}
        pointerEvents="auto"
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={onClose} 
          activeOpacity={1} 
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.dropdown, 
          animatedStyle,
          // Apply dynamic positioning
          { top: dropdownPosition.top, left: dropdownPosition.left }
        ]}
      >
        <View style={styles.dropdownHeader}>
          <Text style={styles.dropdownTitle}>Sort Options</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => handleSelectOption("lowToHigh")} 
          style={styles.dropdownItem} 
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Sort price low to high"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-up" size={18} color="#002d4e" style={styles.itemIcon} />
          <Text style={styles.dropdownText}>Low to High</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleSelectOption("highToLow")} 
          style={styles.dropdownItem} 
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Sort price high to low"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-down" size={18} color="#002d4e" style={styles.itemIcon} />
          <Text style={styles.dropdownText}>High to Low</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleSelectOption("mostLiked")} 
          style={styles.dropdownItem} 
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Sort by most liked"
          accessibilityRole="button"
        >
          <Ionicons name="trending-up" size={18} color="#002d4e" style={styles.itemIcon} />
          <Text style={styles.dropdownText}>Most Liked</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleSelectOption(null)} 
          style={[styles.dropdownItem, styles.clearButton]} 
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Clear filters"
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={18} color="#777" style={styles.itemIcon} />
          <Text style={[styles.dropdownText, styles.clearText]}>Clear Filter</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const FilterDropdown = memo(FilterDropdownComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1001,
  },
  backdropTouchable: {
    width: '100%',
    height: '100%',
  },
  dropdown: {
    position: 'absolute',
    // Position is set dynamically
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1002,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002d4e',
  },
  closeButton: {
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#002d4e',
    fontWeight: '500',
  },
  clearButton: {
    borderBottomWidth: 0,
    backgroundColor: '#f9f9f9',
  },
  clearText: {
    color: '#777',
  },
});