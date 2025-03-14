import React, { useState, useRef, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Watch } from '../types/Watch';
import { NewArrivalBadge } from './NewArrivalBadge';
import { Pagination } from './Pagination';
import LikeCounter from './LikeCounter';

interface WatchCardProps {
  watch: Watch;
  disableNavigation?: boolean;
}

// Create a more efficient image component with caching
const OptimizedImage = memo(({ uri, style, onPress }: { uri: string, style: any, onPress: () => void }) => {
  return (
    <Pressable onPress={onPress} style={style.container}>
      <Image
        source={{ uri }}
        style={style.image}
        resizeMode="cover"
      />
    </Pressable>
  );
});

const WatchCardComponent = ({ watch, disableNavigation = false }: WatchCardProps) => {
  const [cardWidth, setCardWidth] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const images = Array.isArray(watch.image) ? watch.image : [watch.image];
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (!disableNavigation) {
      router.push({
        pathname: `/watch/[id]`,
        params: { id: watch.id }
      });
    }
  }, [disableNavigation, router, watch.id]);

  const onCardLayout = useCallback((event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width);
  }, []);

  // For Animated.event with contentOffset, useNativeDriver MUST be false
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={styles.cardWrapper} onLayout={onCardLayout}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={cardWidth || 400}
            decelerationRate="fast"
            snapToAlignment="center"
            removeClippedSubviews={false} // Prevent visual glitches when images load
            data={images}
            keyExtractor={(item, index) => `${watch.id}-image-${index}`}
            renderItem={({ item: imageUrl }) => (
              <OptimizedImage
                uri={imageUrl}
                style={{
                  container: { width: cardWidth || 400 },
                  image: [styles.image, { width: cardWidth || 400 }]
                }}
                onPress={handlePress}
              />
            )}
            initialNumToRender={3} // Render more items initially to reduce flickering
            maxToRenderPerBatch={4}
            windowSize={5} // Increase window size for smoother loading
            getItemLayout={(data, index) => (
              // Pre-calculate item dimensions to avoid layout shifts
              {length: cardWidth || 400, offset: (cardWidth || 400) * index, index}
            )}
          />

          {watch.newArrival && <NewArrivalBadge />}

          <LikeCounter watch={watch} initialLikes={watch.likes || 0} />

          {images.length > 1 && (
            <Pagination
              scrollX={scrollX}
              cardWidth={cardWidth || 400}
              totalItems={images.length}
            />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.brand} numberOfLines={1}>
            {watch.brand}
          </Text>
          <View style={styles.modelPriceContainer}>
            <Text style={styles.model} numberOfLines={2}>
              {watch.model}
            </Text>
            <Text style={styles.price}>
              ${typeof watch.price === 'number' ? watch.price.toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export const WatchCard = memo(WatchCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    // Add overflow hidden to contain any potential layout shifts
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 9 / 11,
    backgroundColor: '#F6F7F8',
    position: 'relative',
  },
  image: {
    height: '100%',
    // Add specific dimensions to ensure consistent size
    aspectRatio: 9 / 11,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: '#002d4e',
    letterSpacing: 0.3,
  },
  modelPriceContainer: {
    position: 'relative',
    marginTop: 4,
    minHeight: 24,
  },
  model: {
    fontSize: 18,
    fontWeight: '500',
    color: '#002d4e',
    letterSpacing: 0.3,
    paddingRight: 90,
  },
  price: {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#002d4e',
    letterSpacing: 0.3,
  },
});

export default WatchCard;