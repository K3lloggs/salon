import React, { useState, useRef, memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  TouchableOpacity,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Watch } from "../types/Watch";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { Pagination } from "./Pagination";
import LikeCounter from "./LikeCounter";
import { OnHoldBadge } from "./HoldBadge";
import { Ionicons } from "@expo/vector-icons";

// CONSTANTS for consistent dimensions
const IMAGE_ASPECT_RATIO = 9 / 11;
const DEFAULT_CARD_WIDTH = 400;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x450/F6F7F8/F6F7F8';

interface WatchCardProps {
  watch: Watch;
  disableNavigation?: boolean;
}

// Memoize accessory icons to prevent re-renders
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

// Create a highly optimized image component - using TouchableOpacity for better iOS touch handling
const OptimizedImage = memo(
  ({ uri, width, onPress }: { uri: string; width: number; onPress: () => void }) => {
    // Separate the image from the touchable for better touch event handling
    return (
      <View style={{ width, height: width / IMAGE_ASPECT_RATIO }}>
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill]}
          resizeMode="cover"
          fadeDuration={0}
          progressiveRenderingEnabled={true}
          defaultSource={{ uri: PLACEHOLDER_IMAGE }}
        />
        {/* Transparent overlay for touch handling */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.9}
          onPress={onPress}
        />
      </View>
    );
  },
  (prevProps, nextProps) => prevProps.uri === nextProps.uri && prevProps.width === nextProps.width
);

// Create the price component separately to avoid unnecessary re-renders
const PriceDisplay = memo(({ price, msrp }: { price: number | string; msrp?: number }) => (
  <View style={styles.priceContainer}>
    {msrp ? (
      <View style={styles.msrpContainer}>
        <Text style={styles.msrpLabel}>MSRP: </Text>
        <Text style={styles.msrpValue}>${msrp.toLocaleString()}</Text>
      </View>
    ) : null}
    <Text style={styles.price}>
      ${typeof price === "number" ? price.toLocaleString() : "N/A"}
    </Text>
  </View>
));

const WatchCardComponent = ({ watch, disableNavigation = false }: WatchCardProps) => {
  const [cardWidth, setCardWidth] = useState<number>(DEFAULT_CARD_WIDTH);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Memoize the images array to prevent re-creation on each render
  const images = useMemo(() => {
    if (Array.isArray(watch.image) && watch.image.length > 0) {
      return watch.image;
    } else if (typeof watch.image === 'string' && watch.image) {
      return [watch.image];
    } else {
      return [PLACEHOLDER_IMAGE]; // Always ensure at least one image
    }
  }, [watch.image]);

  const router = useRouter();

  // Fix: Use direct string path navigation instead of the pathname/params object
  const handlePress = useCallback(() => {
    if (disableNavigation) return;

    console.log('Navigation triggered for watch ID:', watch.id);
    console.log('Watch ID type:', typeof watch.id);

    try {
      // For iOS builds, use direct string navigation
      router.push("/watch/" + watch.id);
    } catch (error) {
      console.error('Navigation error:', error);

      // Fallback to object-based navigation
      router.push({
        pathname: "/watch/[id]",
        params: { id: String(watch.id) }
      });
    }
  }, [disableNavigation, router, watch.id]);

  const onCardLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width !== cardWidth && width > 0) {
        setCardWidth(width);
      }
    },
    [cardWidth]
  );

  // For Animated.event with contentOffset, useNativeDriver MUST be false
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Memoize getItemLayout to avoid recreating this function on each render
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  // Memoize renderItem to avoid recreating function on each render
  const renderItem = useCallback(
    ({ item: imageUrl }: { item: string }) => (
      <OptimizedImage uri={imageUrl} width={cardWidth} onPress={handlePress} />
    ),
    [cardWidth, handlePress]
  );

  const showPagination = images.length > 1;

  // Handle tap on the entire card (outside the carousel)
  const handleCardPress = useCallback(() => {
    if (!disableNavigation) {
      handlePress();
    }
  }, [disableNavigation, handlePress]);

  return (
    <View style={styles.cardWrapper} onLayout={onCardLayout}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleCardPress}
        style={styles.card}
        disabled={disableNavigation}
      >
        <View style={styles.imageContainer}>
          {/* Important: No pointerEvents="none" on the image container */}
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={cardWidth}
            decelerationRate="fast"
            snapToAlignment="center"
            removeClippedSubviews={false}
            data={images}
            keyExtractor={(item, index) => `${watch.id}-image-${index}`}
            renderItem={renderItem}
            initialNumToRender={1}
            maxToRenderPerBatch={3}
            windowSize={3}
            getItemLayout={getItemLayout}
            onEndReachedThreshold={0.5}
            key={`watch-${watch.id}-${cardWidth}`}
          />

          {/* Overlays with pointerEvents set to "box-none" to allow touches to pass through */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Badges section */}
            <BadgesDisplay newArrival={watch.newArrival} hold={!!watch.hold} />

            {/* LikeCounter */}
            <LikeCounter watch={watch} initialLikes={watch.likes || 0} />

            {/* WatchAccessories */}
            <WatchAccessories box={watch.box} papers={watch.papers} />

            {/* Pagination */}
            {showPagination && (
              <View style={styles.paginationContainer} pointerEvents="none">
                <Pagination
                  scrollX={scrollX}
                  cardWidth={cardWidth}
                  totalItems={images.length}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.brand} numberOfLines={1}>
            {watch.brand || "Brand"}
          </Text>
          <View style={styles.modelPriceContainer}>
            <Text style={styles.model} numberOfLines={2}>
              {watch.model || "Model"}
            </Text>
            <PriceDisplay price={watch.price || 0} msrp={watch.msrp} />
          </View>
        </View>
      </TouchableOpacity>
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
    maxWidth: DEFAULT_CARD_WIDTH,
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
    aspectRatio: IMAGE_ASPECT_RATIO,
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
    minHeight: 44, // Increased to accommodate larger MSRP and price
  },
  model: {
    fontSize: 18,
    fontWeight: "500",
    color: "#002d4e",
    letterSpacing: 0.3,
    paddingRight: 120, // Increased to account for MSRP + price
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#002d4e",
    letterSpacing: 0.3,
  },
  badgesContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    zIndex: 10,
  },
  stackedBadge: {
    marginTop: 26, // Space between badges when stacked
  },
  paginationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  priceContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    alignItems: "flex-end",
  },
  msrpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  msrpLabel: {
    fontSize: 14,
    color: "#002d4e",
    opacity: 0.8,
  },
  msrpValue: {
    fontSize: 14,
    color: "#002d4e",
    opacity: 0.8,
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
});

export default WatchCard;