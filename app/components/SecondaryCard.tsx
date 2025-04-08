import React, { useRef, useState, memo } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  Text,
  Modal,
  ScrollView,
  StyleSheet as RNStyleSheet,
} from "react-native";
import {
  GestureHandlerRootView,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
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

  // Normalize images from the watch object.
  const images =
    Array.isArray(watch.image) && watch.image.length > 0
      ? watch.image
      : typeof watch.image === "string" && watch.image
      ? [watch.image]
      : [];

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
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
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

          {/* Favorite Button (Top Right) */}
          <View style={modalStyles.favoriteButton}>
            <FavoriteButton />
          </View>

          {/* Pagination in Modal (Top Right) */}
          {showPagination && (
            <View style={modalStyles.paginationContainer}>
              <Pagination
                scrollX={modalScrollX}
                cardWidth={SCREEN_WIDTH}
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
              ${typeof watch.price === "number" ? watch.price.toLocaleString() : "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    // Wrap the entire component in GestureHandlerRootView so that all gesture handlers work properly.
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
              <View style={[RNStyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
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
            </View>
          </Animated.View>
        </TapGestureHandler>
      </View>
      {renderZoomModal()}
    </GestureHandlerRootView>
  );
};

export const SecondaryCard = memo(SecondaryCardComponent);

const styles = RNStyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.9,
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
  paginationContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 20,
  },
});

const modalStyles = RNStyleSheet.create({
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
