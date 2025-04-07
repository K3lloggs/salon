import React, { useRef, useState, memo } from "react";
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pagination } from "./Pagination";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { OnHoldBadge } from "./HoldBadge";
import { FavoriteButton } from "./FavoriteButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Watch {
  id: string;
  brand: string;
  model: string;
  price: number;
  msrp?: number;
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
  referenceNumber?: string;
  sku?: string;
  skuNumber?: string;
  [key: string]: any;
}

interface SecondaryCardProps {
  watch: Watch;
}

const SecondaryCardComponent: React.FC<SecondaryCardProps> = ({ watch }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<string>>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const modalScrollX = useRef(new Animated.Value(0)).current;

  // Normalize images: use all images if available.
  const images = Array.isArray(watch.image)
    ? watch.image.length > 0
      ? watch.image
      : []
    : typeof watch.image === "string" && watch.image
    ? [watch.image]
    : [];

  const showPagination = images.length > 1;

  const handleZoom = () => {
    setZoomVisible(true);
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

  // Zoom Modal with updated overlays for SKU/Reference and MSRP/Price
  const renderZoomModal = () => (
    <Modal visible={zoomVisible} transparent animationType="fade">
      <View style={modalStyles.modalContainer}>
        {/* Tapping the background closes the modal */}
        <TouchableOpacity
          style={modalStyles.modalBackground}
          onPress={() => setZoomVisible(false)}
          activeOpacity={1}
        />
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
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />

          {/* Close Button (Top Left, brought down a bit) */}
          <TouchableOpacity
            style={modalStyles.closeButton}
            onPress={() => setZoomVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Favorite Button (Top Right) */}
          <View style={modalStyles.favoriteButton}>
            <FavoriteButton />
          </View>

          {/* Pagination (Top Right, below FavoriteButton) */}
          {showPagination && (
            <View style={modalStyles.paginationContainer}>
              <Pagination
                scrollX={modalScrollX}
                cardWidth={SCREEN_WIDTH}
                totalItems={images.length}
              />
            </View>
          )}

          {/* Bottom Left: Display Reference and SKU with white text and navy blue outline */}
          <View style={modalStyles.bottomLeftContainer}>
            {watch.referenceNumber && (
              <Text style={modalStyles.bottomLeftText}>
                Ref. {watch.referenceNumber}
              </Text>
            )}
            {(watch.sku || watch.skuNumber) && (
              <Text style={modalStyles.bottomLeftText}>
                SKU: {watch.sku || watch.skuNumber}
              </Text>
            )}
          </View>

          {/* Bottom Right: Display MSRP and Price with white text and navy blue outline */}
          <View style={modalStyles.bottomRightContainer}>
            {watch.msrp && (
              <Text style={modalStyles.bottomRightMsrp}>
                MSRP: ${watch.msrp.toLocaleString()}
              </Text>
            )}
            <Text style={modalStyles.bottomRightText}>
              ${typeof watch.price === "number" ? watch.price.toLocaleString() : "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Badges */}
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

        {/* Image Carousel with Zoom Trigger */}
        <TouchableOpacity onPress={handleZoom} activeOpacity={0.9}>
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
            renderItem={renderItem}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={handleScrollToIndexFailed}
          />
        </TouchableOpacity>

        {/* Box & Papers Indicators */}
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
      </View>
      {renderZoomModal()}
    </>
  );
};

export const SecondaryCard = memo(SecondaryCardComponent);

/* -------------------- Styles -------------------- */

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
});

const modalStyles = StyleSheet.create({
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
    width: SCREEN_WIDTH,
    height: "100%",
  },
  zoomScrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.9,
  },
  // Close Button (brought down a bit)
  closeButton: {
    position: "absolute",
    top: 50, // increased from 40
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
  },
  // Favorite Button (Top Right)
  favoriteButton: {
    position: "absolute",
    top: 40,
    right: 16,
    zIndex: 20,
  },
  // Pagination (Top Right, below FavoriteButton)
  paginationContainer: {
    position: "absolute",
    top: 90,
    right: 16,
    zIndex: 20,
  },
  // Bottom Left: Display Reference and SKU with white text and navy blue outline
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
    textShadowColor: "#002d4e",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Bottom Right: MSRP & Price with white text and navy blue outline
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
    textShadowColor: "#002d4e",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomRightText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "#002d4e",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
