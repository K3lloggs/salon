import React, { useRef, useMemo, memo } from "react";
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
    caseMaterial?: string;
    caseDiameter?: string;
    newArrival?: boolean;
    hold?: boolean;
    [key: string]: any;
  };
}

// Memoized accessory icons component to prevent re-renders
const WatchAccessories = memo(({ box, papers }: { box?: boolean; papers?: boolean }) => {
  if (!box && !papers) return null;
  
  return (
    <View style={styles.accessoriesContainer} pointerEvents="none">
      {box && (
        <View style={styles.accessoryIcon}>
          <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
        </View>
      )}
      {papers && (
        <View style={styles.accessoryIcon}>
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
});

// Memoized image component for better performance
const WatchImage = memo(({ uri }: { uri: string }) => (
  <View style={styles.imageContainer}>
    <Image 
      source={{ uri }} 
      style={styles.image} 
      resizeMode="cover"
      fadeDuration={0}
      progressiveRenderingEnabled={true}
    />
  </View>
));

// Memoized badges component
const BadgesDisplay = memo(({ newArrival, hold }: { newArrival?: boolean; hold?: boolean }) => {
  if (!newArrival && !hold) return null;
  
  return (
    <View style={styles.badgesContainer} pointerEvents="none">
      {newArrival && <NewArrivalBadge />}
      {hold && (
        <View style={newArrival ? styles.stackedBadge : null}>
          <OnHoldBadge />
        </View>
      )}
    </View>
  );
});

const SecondaryCardComponent: React.FC<SecondaryCardProps> = ({ watch }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Memoize the images array to prevent re-creation on each render
  const images = useMemo(() => 
    Array.isArray(watch.image) ? watch.image : [watch.image], 
    [watch.image]
  );

  // Memoize the scroll event to prevent re-creation
  const handleScroll = useMemo(() => 
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    ), 
    [scrollX]
  );

  const showPagination = images.length > 1;

  return (
    <View style={styles.container}>
      {/* Use memoized badges component */}
      <BadgesDisplay newArrival={watch.newArrival} hold={watch.hold} />
      
      <Animated.FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        data={images}
        keyExtractor={(_, index) => `${watch.id}-image-${index}`}
        renderItem={({ item }) => <WatchImage uri={item} />}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
      />

      {/* Use memoized accessories component */}
      <WatchAccessories box={watch.box} papers={watch.papers} />

      {/* Only render pagination if needed */}
      {showPagination && (
        <View style={styles.paginationContainer} pointerEvents="none">
          <Pagination 
            scrollX={scrollX} 
            cardWidth={SCREEN_WIDTH} 
            totalItems={images.length} 
          />
        </View>
      )}
    </View>
  );
};

// Memoize the entire component
export const SecondaryCard = memo(SecondaryCardComponent);

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
    marginTop: 26, // Space between badges when stacked
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

export default SecondaryCard;