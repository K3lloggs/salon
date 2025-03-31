import React, { useRef } from "react";
import { View, Image, Animated, StyleSheet, Dimensions } from "react-native";
import { Pagination } from "./Pagination";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { OnHoldBadge } from "./HoldBadge";
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SecondaryCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    price: number;
    image: string[] | string;
    movement?: string;
    dial?: string;
    powerReserve?: string;
    strap?: string;
    year?: string;
    box?: boolean;
    papers?: boolean;
    newArrival?: boolean;
    hold?: boolean;
    [key: string]: any;
  };
}

function SecondaryCardComponent({ watch }: SecondaryCardProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  // Process images similar to WatchCard:
  // If there are 2 or more images, use images starting from index 1.
  const images = Array.isArray(watch.image)
    ? (watch.image.length >= 2 ? watch.image.slice(1) : watch.image)
    : typeof watch.image === 'string' && watch.image
      ? [watch.image]
      : [];

  const showPagination = images.length > 1;

  return (
    <View style={styles.container}>
      {/* Badges */}
      {(watch.newArrival || watch.hold) && (
        <View style={styles.badgesContainer}>
          {watch.newArrival && <NewArrivalBadge />}
          {watch.hold && (
            <View style={watch.newArrival ? styles.stackedBadge : null}>
              <OnHoldBadge />
            </View>
          )}
        </View>
      )}
      
      {/* Image carousel */}
      <Animated.FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        data={images}
        keyExtractor={(_, index) => `${watch.id}-detail-${index}`}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item }} 
              style={styles.image}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>
        )}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        // Since we sliced the images, the first rendered image is already the desired one.
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
          setTimeout(() => {
            if (flatListRef.current && images.length > 0) {
              flatListRef.current.scrollToIndex({
                animated: false,
                index: 0,
              });
            }
          }, 100);
        }}
      />

      {/* Box and Papers indicators */}
      {(watch.box || watch.papers) && (
        <View style={styles.accessoriesContainer}>
          {watch.box && (
            <View style={styles.accessoryIcon}>
              <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
            </View>
          )}
          {watch.papers && (
            <View style={styles.accessoryIcon}>
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}

      {/* Pagination dots */}
      {showPagination && (
        <View style={styles.paginationContainer}>
          <Pagination 
            scrollX={scrollX} 
            cardWidth={SCREEN_WIDTH} 
            totalItems={images.length} 
          />
        </View>
      )}
    </View>
  );
}

export const SecondaryCard = SecondaryCardComponent;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.9,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgesContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 20,
  },
  stackedBadge: {
    marginTop: 26,
  },
  accessoriesContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    zIndex: 10,
  },
  accessoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 45, 78, 0.8)",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
