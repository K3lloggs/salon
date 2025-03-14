import React, { memo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface PaginationProps {
  scrollX: Animated.Value; // Animated horizontal scroll value
  cardWidth: number;      // Width of each card/page
  totalItems: number;     // Total number of images
}

const INACTIVE_DOT_SIZE = 6;
const ACTIVE_DOT_SIZE = 8;
const DOT_MARGIN = 4;

function PaginationComponent({ scrollX, cardWidth, totalItems }: PaginationProps) {
  // Dot sizing and spacing constants
  // Each dot slot includes the maximum dot size plus horizontal margins
  const SLOT_WIDTH = ACTIVE_DOT_SIZE + DOT_MARGIN * 2;

  // If 5 or fewer items, render directly without sliding
  if (totalItems <= 5) {
    return (
      <View style={styles.pagination}>
        {Array.from({ length: totalItems }).map((_, index) => {
          const inputRange = [
            (index - 1) * cardWidth,
            index * cardWidth,
            (index + 1) * cardWidth,
          ];
          // Using width/height animations with useNativeDriver: false by default
          const dotSize = scrollX.interpolate({
            inputRange,
            outputRange: [INACTIVE_DOT_SIZE, ACTIVE_DOT_SIZE, INACTIVE_DOT_SIZE],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotSize, height: dotSize, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  }

  // For more than 5 items, create a sliding window of dots
  // The active dot should stay centered when possible.
  const translateX = scrollX.interpolate({
    inputRange: [
      0,
      2 * cardWidth,
      (totalItems - 3) * cardWidth,
      (totalItems - 1) * cardWidth,
    ],
    outputRange: [
      0,
      0,
      -((totalItems - 5) * SLOT_WIDTH),
      -((totalItems - 5) * SLOT_WIDTH),
    ],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.pagination}>
      {/* Clip container ensures only 5 dot slots are visible */}
      <View style={[styles.clipContainer, { width: 5 * SLOT_WIDTH }]}>
        <Animated.View
          style={{
            flexDirection: 'row',
            // Cancel the extra left/right margin of the first and last dots
            marginHorizontal: -DOT_MARGIN,
            // Ensuring the width accounts for all dots
            width: totalItems * SLOT_WIDTH,
            transform: [{ translateX }], // translateX uses scrollX which doesn't use native driver
          }}
        >
          {Array.from({ length: totalItems }).map((_, index) => {
            const dotInputRange = [
              (index - 1) * cardWidth,
              index * cardWidth,
              (index + 1) * cardWidth,
            ];
            // Using width/height animations with useNativeDriver: false by default
            const dotSize = scrollX.interpolate({
              inputRange: dotInputRange,
              outputRange: [INACTIVE_DOT_SIZE, ACTIVE_DOT_SIZE, INACTIVE_DOT_SIZE],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange: dotInputRange,
              outputRange: [0.5, 1, 0.5],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotSize, height: dotSize, opacity },
                ]}
              />
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

// Memoize the component for better performance
export const Pagination = memo(PaginationComponent);

const styles = StyleSheet.create({
  pagination: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  clipContainer: {
    overflow: 'hidden', // Clips the dot row so only 5 dots are visible
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: DOT_MARGIN,
    borderWidth: 1,
    borderColor: '#002d4e',
    backgroundColor: '#fff', // White fill for contrast
  },
});