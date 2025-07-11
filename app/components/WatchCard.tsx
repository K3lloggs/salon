import React, { useState, useRef, memo, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  LayoutChangeEvent,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Watch } from "../types/Watch";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { Pagination } from "./Pagination";
import LikeCounter from "./LikeCounter";
import { OnHoldBadge } from "./HoldBadge";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const IMAGE_ASPECT_RATIO = 9 / 11;

interface WatchCardProps {
  watch: Watch;
  disableNavigation?: boolean;
}

// Using Animated.Image to smoothly fade in images
const OptimizedImage = memo(
  ({ uri, width, onPress }: { uri: string; width: number; onPress: () => void }) => {
    const imageOpacity = useRef(new Animated.Value(0)).current;

    const handleImageLoad = () => {
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={{ width, height: width / IMAGE_ASPECT_RATIO }}>
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          progressiveRenderingEnabled={true}
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
  (prevProps, nextProps) =>
    prevProps.uri === nextProps.uri && prevProps.width === nextProps.width
);

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

const BadgesDisplay = memo(({ newArrival, hold }: { newArrival?: boolean; hold?: boolean }) => {
  if (!newArrival && !hold) return null;
  return (
    <View style={styles.badgesContainer} pointerEvents="none">
      {newArrival && <NewArrivalBadge />}
      {hold && (
        <View style={newArrival ? styles.stackedBadge : undefined}>
          <OnHoldBadge />
        </View>
      )}
    </View>
  );
});

const PriceDisplay = memo(({ price, msrp }: { price: number | string; msrp?: number }) => {
  const { isDark } = useTheme();
  const textColor = isDark ? "#fff" : "#002d4e";
  
  return (
    <View style={styles.priceContainer}>
      <View>
        {msrp ? (
          <View style={styles.msrpContainer}>
            <Text style={[styles.msrpLabel, { color: textColor }]}>MSRP: </Text>
            <Text style={[styles.msrpValue, { color: textColor }]}>${msrp.toLocaleString()}</Text>
          </View>
        ) : null}
        <Text style={[styles.price, msrp ? styles.withMsrp : styles.singlePrice, { color: textColor }]}>
          ${typeof price === "number" ? price.toLocaleString() : "N/A"}
        </Text>
      </View>
    </View>
  );
});

const WatchCardComponent = ({ watch, disableNavigation = false }: WatchCardProps) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();
  
  // Use the more modern hook for window dimensions
  const { width: windowWidth } = useWindowDimensions();
  
  // Use full screen width for the card
  const cardWidth = useMemo(() => {
    return windowWidth; // 100% of screen width
  }, [windowWidth]);

  // Process images based on the watch data structure
  const images = useMemo(() => {
    if (Array.isArray(watch.image)) {
      if (watch.image.length >= 2) {
        return watch.image.slice(1);
      } else {
        return watch.image;
      }
    } else if (typeof watch.image === "string" && watch.image) {
      return [watch.image];
    } else {
      return [];
    }
  }, [watch.image]);

  const router = useRouter();

  const handlePress = useCallback(() => {
    if (disableNavigation) return;
    try {
      router.push("/watch/" + watch.id);
    } catch (error) {
      router.push({
        pathname: "/watch/[id]",
        params: { id: String(watch.id) },
      });
    }
  }, [disableNavigation, router, watch.id]);

  // Wrap entire card in onPress so clicking anywhere triggers navigation.
  const handleCardPress = useCallback(() => {
    if (!disableNavigation) {
      handlePress();
    }
  }, [disableNavigation, handlePress]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  const renderItem = useCallback(
    ({ item: imageUrl }: { item: string }) => (
      <OptimizedImage uri={imageUrl} width={cardWidth} onPress={handlePress} />
    ),
    [cardWidth, handlePress]
  );

  const showPagination = images.length > 1;

  // Theme-specific colors
  const cardBgColor = isDark ? "#222" : "#FFFFFF";
  const cardBorderColor = isDark ? "#444" : "#C8C7CC";
  const textColor = isDark ? "#fff" : "#002d4e";
  const imageContainerBg = isDark ? "#333" : "#F6F7F8";

  return (
    <View 
      style={[
        styles.cardWrapper, 
        { 
          width: cardWidth, 
          backgroundColor: cardBgColor, 
          borderColor: cardBorderColor
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleCardPress}
        style={[styles.card, { backgroundColor: cardBgColor }]}
        disabled={disableNavigation}
      >
        <View style={[styles.imageContainer, { backgroundColor: imageContainerBg }]}>
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

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <BadgesDisplay newArrival={watch.newArrival} hold={!!watch.hold} />
            <LikeCounter watch={watch} initialLikes={watch.likes || 0} />
            <WatchAccessories box={watch.box} papers={watch.papers} />
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

        <View style={[styles.infoContainer, { backgroundColor: cardBgColor }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.brand, { color: textColor }]} numberOfLines={1}>
              {watch.brand || "Brand"}
            </Text>
            <View style={styles.priceWrapper}>
              <PriceDisplay price={watch.price || 0} msrp={watch.msrp} />
            </View>
          </View>
          <Text style={[styles.model, { color: textColor }]} numberOfLines={3}>
            {watch.model || "Model"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const WatchCard = memo(
  WatchCardComponent,
  (prevProps, nextProps) =>
    prevProps.watch.id === nextProps.watch.id &&
    prevProps.watch.likes === nextProps.watch.likes &&
    prevProps.disableNavigation === nextProps.disableNavigation
);

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT_RATIO,
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
    paddingBottom: 12,
  },
  headerRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    width: "100%",
  },
  priceWrapper: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  brand: {
    fontSize: 20,
    fontWeight: "500",
    letterSpacing: 0.3,
    flex: 1,
    paddingRight: 8,
  },
  model: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.4,
    marginTop: 2,
    marginRight: 100,
  },
  priceContainer: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  msrpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
    justifyContent: "flex-end",
  },
  msrpLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  msrpValue: {
    fontSize: 12,
    opacity: 0.8,
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  withMsrp: {
    alignSelf: "flex-end",
  },
  singlePrice: {
    lineHeight: 24,
    marginLeft: 0,
  },
  badgesContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    zIndex: 10,
  },
  stackedBadge: {
    marginTop: 26,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default WatchCard;