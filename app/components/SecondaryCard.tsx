import React, { useRef, useState, memo, useMemo } from "react";
import {
  View,
  Image,
  Animated,
  useWindowDimensions,
  Text,
  Modal,
  ScrollView,
  StyleSheet as RNStyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  GestureHandlerRootView,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pagination } from "./Pagination";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { OnHoldBadge } from "./HoldBadge";
import { useFavorites } from "../context/FavoritesContext";
import LikeCounter from "./LikeCounter";

import { Watch } from "../types/Watch";

interface SecondaryCardProps {
  watch: Watch;
}

// Function to create dynamic styles based on the current screen width.
const getStyles = (screenWidth: number) =>
  RNStyleSheet.create({
    container: {
      width: screenWidth,
      height: screenWidth * 0.9,
      backgroundColor: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
      position: "relative",
    },
    card: {
      flex: 1,
    },
    imageContainer: {
      width: screenWidth,
      height: "100%",
      position: "relative",
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
    paginationContainer: {
      position: "absolute",
      bottom: 12,
      right: 12,
      zIndex: 20,
    },
    favoriteButtonContainer: {
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 20,
    },
    favoriteIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      alignItems: "center",
      justifyContent: "center",
    },
    likeCounterWrapper: {
      position: "absolute",
      top: 8,  // Changed from 16 to 8 to align with the stock badge
      right: 0,
      zIndex: 30,
    },
  });

const getModalStyles = (screenWidth: number) =>
  RNStyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
    },
    modalBackground: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    modalContent: {
      flex: 1,
    },
    zoomScrollView: {
      width: screenWidth,
      height: "100%",
    },
    zoomScrollContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    zoomImage: {
      width: screenWidth,
      height: screenWidth * 0.9,
    },
    closeButton: {
      position: "absolute",
      top: 40,
      left: 16,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 20,
      padding: 8,
      zIndex: 20,
    },
    favoriteButton: {
      position: "absolute",
      top: 40,
      right: 16,
      zIndex: 20,
    },
    paginationContainer: {
      position: "absolute",
      top: 90,
      right: 16,
      zIndex: 20,
    },
    bottomLeftContainer: {
      position: "absolute",
      bottom: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    bottomLeftText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 4,
    },
    bottomRightContainer: {
      position: "absolute",
      bottom: 12,
      right: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: "flex-end",
    },
    bottomRightMsrp: {
      color: "#fff",
      fontSize: 16,
      textDecorationLine: "line-through",
      opacity: 0.8,
      marginBottom: 4,
    },
    bottomRightText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  });

const SecondaryCardComponent: React.FC<SecondaryCardProps> = ({ watch }) => {
  // Get live dimensions from hook (updates on orientation change).
  const { width: screenWidth } = useWindowDimensions();
  const styles = getStyles(screenWidth);
  const modalStyles = getModalStyles(screenWidth);
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<string>>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const modalScrollX = useRef(new Animated.Value(0)).current;

  // Normalize images from the watch object.
  const images = useMemo(() => {
    if (Array.isArray(watch.image) && watch.image.length > 1) {
      // Start from the second image (index 1) instead of the first
      return watch.image.slice(1);
    } else if (Array.isArray(watch.image) && watch.image.length === 1) {
      // If there's only one image, use that
      return watch.image;
    } else if (typeof watch.image === "string" && watch.image) {
      // Handle string case
      return [watch.image];
    } else {
      return []; // No image fallback
    }
  }, [watch.image]);

  const showPagination = images.length > 1;

  const handleZoom = () => {
    setZoomVisible(true);
  };

  // Only trigger zoom if the tap has minimal movement.
  const onSingleTapEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      handleZoom();
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
    </View>
  );

  const handleScrollToIndexFailed = (info: any) => {
    console.warn("Scroll to index failed:", info);
    setTimeout(() => {
      if (flatListRef.current && images.length > 0) {
        flatListRef.current.scrollToIndex({
          animated: false,
          index: 0,
        });
      }
    }, 100);
  };

  // Zoom Modal that shows the full-screen image carousel.
  const renderZoomModal = () => (
    <Modal visible={zoomVisible} transparent animationType="fade">
      <View style={modalStyles.modalContainer}>
        {/* Wrap the modal background in a TapGestureHandler to dismiss */}
        <TapGestureHandler
          onHandlerStateChange={(e) => {
            if (e.nativeEvent.state === State.END) setZoomVisible(false);
          }}
        >
          <View style={modalStyles.modalBackground} />
        </TapGestureHandler>
        <View style={modalStyles.modalContent}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(_, index) => `${watch.id}-zoom-${index}`}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: modalScrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <ScrollView
                style={modalStyles.zoomScrollView}
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentContainerStyle={modalStyles.zoomScrollContent}
              >
                <Image
                  source={{ uri: item }}
                  style={modalStyles.zoomImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
            initialNumToRender={1}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />

          {/* Close Button (Top Left) */}
          <View style={modalStyles.closeButton}>
            <Ionicons
              name="close"
              size={24}
              color="#fff"
              onPress={() => setZoomVisible(false)}
            />
          </View>

          {/* Pagination in Modal (Top Right) */}
          {showPagination && (
            <View style={modalStyles.paginationContainer}>
              <Pagination
                scrollX={modalScrollX}
                cardWidth={screenWidth}
                totalItems={images.length}
              />
            </View>
          )}

          {/* Bottom Left: Reference & SKU info */}
          <View style={modalStyles.bottomLeftContainer}>
            {watch.referenceNumber ? (
              <Text style={modalStyles.bottomLeftText}>
                Ref. {watch.referenceNumber}
              </Text>
            ) : null}
            {watch.sku || watch.skuNumber ? (
              <Text style={modalStyles.bottomLeftText}>
                SKU: {watch.sku || watch.skuNumber}
              </Text>
            ) : null}
          </View>

          {/* Bottom Right: MSRP & Price */}
          <View style={modalStyles.bottomRightContainer}>
            {watch.msrp ? (
              <Text style={modalStyles.bottomRightMsrp}>
                MSRP: ${watch.msrp.toLocaleString()}
              </Text>
            ) : null}
            <Text style={modalStyles.bottomRightText}>
              $
              {typeof watch.price === "number"
                ? watch.price.toLocaleString()
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    // Wrap the entire component in GestureHandlerRootView for proper gesture handling.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Badges (New Arrival, On Hold) */}
        {(watch.newArrival || watch.hold) && (
          <View style={styles.badgesContainer}>
            {watch.newArrival && <NewArrivalBadge />}
            {watch.hold && (
              <View style={watch.newArrival ? styles.stackedBadge : undefined}>
                <OnHoldBadge />
              </View>
            )}
          </View>
        )}

        {/* Add LikeCounter with wrapper to ensure proper positioning */}
        <View style={styles.likeCounterWrapper} pointerEvents="box-none">
          <LikeCounter watch={watch} initialLikes={watch.likes || 0} />
        </View>

        {/* Use TapGestureHandler to distinguish between a tap and swipe on the image carousel */}
        <TapGestureHandler
          onHandlerStateChange={onSingleTapEvent}
          maxDeltaX={10}
          maxDeltaY={10}
        >
          <Animated.View style={styles.card}>
            <View style={styles.imageContainer}>
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
                snapToInterval={screenWidth}
                snapToAlignment="center"
                data={images}
                keyExtractor={(_, index) => `${watch.id}-detail-${index}`}
                renderItem={renderItem}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                getItemLayout={(_, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                onScrollToIndexFailed={handleScrollToIndexFailed}
              />
              <View style={[RNStyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
                {showPagination && (
                  <View style={styles.paginationContainer}>
                    <Pagination
                      scrollX={scrollX}
                      cardWidth={screenWidth}
                      totalItems={images.length}
                    />
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </TapGestureHandler>
      </View>
      {renderZoomModal()}
    </GestureHandlerRootView>
  );
};

export const SecondaryCard = memo(SecondaryCardComponent);