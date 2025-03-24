import React, { useState, useRef, memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Watch } from "../types/Watch";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { Pagination } from "./Pagination";
import LikeCounter from "./LikeCounter";
import { Ionicons } from "@expo/vector-icons";

interface WatchCardProps {
  watch: Watch;
  disableNavigation?: boolean;
}

// Memoize accessory icons to prevent re-renders
const WatchAccessories = memo(({ box, papers }: { box: boolean; papers: boolean }) => {
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

// Pre-compute styles for better performance
const imageStyles = StyleSheet.create({
  image: {
    height: "100%",
    aspectRatio: 9 / 11,
  },
});

// Create a highly optimized image component
const OptimizedImage = memo(
  ({ uri, width, onPress }: { uri: string; width: number; onPress: () => void }) => {
    // Memoize the container style to avoid object creation on each render
    const containerStyle = useMemo(() => ({ width }), [width]);
    // Memoize the combined styles
    const imageStyle = useMemo(() => [imageStyles.image, { width }], [width]);
    return (
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={containerStyle}
      >
        <Image
          source={{ uri }}
          style={imageStyle}
          resizeMode="cover"
          fadeDuration={0}
          progressiveRenderingEnabled={true}
        />
      </Pressable>
    );
  }
);

// Create the price component separately to avoid unnecessary re-renders
const PriceDisplay = memo(({ price }: { price: number | string }) => (
  <Text style={styles.price}>
    ${typeof price === "number" ? price.toLocaleString() : "N/A"}
  </Text>
));

const WatchCardComponent = ({ watch, disableNavigation = false }: WatchCardProps) => {
  const [cardWidth, setCardWidth] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Memoize the images array to prevent re-creation on each render
  const images = useMemo(
    () => (Array.isArray(watch.image) ? watch.image : [watch.image]),
    [watch.image]
  );

  const router = useRouter();

  const handlePress = useCallback(() => {
    if (!disableNavigation) {
      router.push({
        pathname: `/watch/[id]`,
        params: { id: watch.id },
      });
    }
  }, [disableNavigation, router, watch.id]);

  const onCardLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width !== cardWidth) {
        setCardWidth(width);
      }
    },
    [cardWidth]
  );

  // For Animated.event with contentOffset, useNativeDriver MUST be false
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: false,
      }),
    [scrollX]
  );

  // Memoize getItemLayout to avoid recreating this function on each render
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: cardWidth || 400,
      offset: (cardWidth || 400) * index,
      index,
    }),
    [cardWidth]
  );

  // Memoize renderItem to avoid recreating function on each render
  const renderItem = useCallback(
    ({ item: imageUrl }: { item: string }) => (
      <OptimizedImage uri={imageUrl} width={cardWidth || 400} onPress={handlePress} />
    ),
    [cardWidth, handlePress]
  );

  const showPagination = images.length > 1;

  return (
    <View style={styles.cardWrapper} onLayout={onCardLayout}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            snapToInterval={cardWidth || 400}
            decelerationRate="fast"
            snapToAlignment="center"
            removeClippedSubviews={Platform.OS === "android"}
            data={images}
            keyExtractor={(item, index) => `${watch.id}-image-${index}`}
            renderItem={renderItem}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            getItemLayout={getItemLayout}
            onEndReachedThreshold={0.5}
            key={`watch-${watch.id}`}
          />

          {/* Wrap overlays in a view with pointerEvents="none" so they do not intercept touches */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {watch.newArrival && <NewArrivalBadge />}
            <LikeCounter watch={watch} initialLikes={watch.likes || 0} />
            <WatchAccessories box={watch.box} papers={watch.papers} />
            {showPagination && (
              <Pagination
                scrollX={scrollX}
                cardWidth={cardWidth || 400}
                totalItems={images.length}
              />
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.brand} numberOfLines={1}>
            {watch.brand}
          </Text>
          <View style={styles.modelPriceContainer}>
            <Text style={styles.model} numberOfLines={2}>
              {watch.model}
            </Text>
            <PriceDisplay price={watch.price} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Memoize the entire component with a custom comparison function
export const WatchCard = memo(
  WatchCardComponent,
  (prevProps, nextProps) =>
    prevProps.watch.id === nextProps.watch.id &&
    prevProps.watch.likes === nextProps.watch.likes &&
    prevProps.disableNavigation === nextProps.disableNavigation
);

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#002d4e",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 9 / 11,
    backgroundColor: "#F6F7F8",
    position: "relative",
  },
  accessoriesContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    zIndex: 10,
  },
  accessoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 45, 78, 0.8)",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    color: "#002d4e",
    letterSpacing: 0.3,
  },
  modelPriceContainer: {
    position: "relative",
    marginTop: 4,
    minHeight: 24,
  },
  model: {
    fontSize: 18,
    fontWeight: "500",
    color: "#002d4e",
    letterSpacing: 0.3,
    paddingRight: 90,
  },
  price: {
    position: "absolute",
    right: 0,
    top: 0,
    fontSize: 18,
    fontWeight: "700",
    color: "#002d4e",
    letterSpacing: 0.3,
  },
});

export default WatchCard;
