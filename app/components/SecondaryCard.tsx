import React, { useRef } from "react";
import { View, Image, Animated, StyleSheet, Dimensions } from "react-native";
import { Pagination } from "./Pagination";
import { NewArrivalBadge } from "./NewArrivalBadge";
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SecondaryCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    price: number;
    image: string[];
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
    [key: string]: any;
  };
}

// Icons for Box and Papers
const WatchAccessories = ({ watch }: { watch: any }) => {
  if (!watch.box && !watch.papers) return null;
  
  return (
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
  );
};

export const SecondaryCard: React.FC<SecondaryCardProps> = ({ watch }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const images = Array.isArray(watch.image) ? watch.image : [watch.image];

  return (
    <View style={styles.container}>
      {watch.newArrival && <NewArrivalBadge />}
      <Animated.ScrollView
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
      >
        {images.map((img, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Box and Papers icons */}
      <WatchAccessories watch={watch} />

      {images.length > 1 && (
        <Pagination scrollX={scrollX} cardWidth={SCREEN_WIDTH} totalItems={images.length} />
      )}
    </View>
  );
};

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

export default SecondaryCard;