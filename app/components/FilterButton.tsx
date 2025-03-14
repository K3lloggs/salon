import React, { useState, useRef, useEffect, memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useSortContext } from '../context/SortContext';
import { Ionicons } from '@expo/vector-icons';

interface FilterDropdownProps {
  isVisible: boolean;
  onSelect: (option: "lowToHigh" | "highToLow" | null) => void;
  onClose: () => void;
}

function FilterDropdownComponent({ isVisible, onSelect, onClose }: FilterDropdownProps) {
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

  const handleSelectOption = (option: "lowToHigh" | "highToLow" | null) => {
    onSelect(option);
  };

  const animatedStyle = {
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
      
      <Animated.View style={[styles.dropdown, animatedStyle]}>
        <View style={styles.dropdownHeader}>
          <Text style={styles.dropdownTitle}>Sort by Price</Text>
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
          <Text style={styles.dropdownText}>Price: Low to High</Text>
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
          <Text style={styles.dropdownText}>Price: High to Low</Text>
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
    top: 78, // Position just below the header (76px height) with small gap
    right: 16,
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
    paddingVertical: 16,
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