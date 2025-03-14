// app/fine-art/[id].tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FixedHeader } from '../components/FixedHeader';
import { MessageButton } from '../components/MessageButton';
import { useArtPiece } from '../hooks/useArtPieces';

export default function ArtDetailScreen() {
  const { id } = useLocalSearchParams();
  const { artPieces, loading, error } = useArtPiece();
  const art = artPieces.find(a => a.id === id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FixedHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002d4e" />
        </View>
      </SafeAreaView>
    );
  }

  if (!art) {
    return (
      <SafeAreaView style={styles.container}>
        <FixedHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Artwork not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FixedHeader />
      <ScrollView>
        <View style={styles.imageContainer}>
          {art.image[0] && (
            <Image
              source={{ uri: art.image[0] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{art.title}</Text>
          <Text style={styles.artist}>{art.artist}</Text>
          <Text style={styles.price}>
            {typeof art.price === 'number'
              ? `$${art.price.toLocaleString()}`
              : art.price}
          </Text>

          <View style={styles.detailsContainer}>
            {art.year && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Year</Text>
                <Text style={styles.detailValue}>{art.year}</Text>
              </View>
            )}

            {art.medium && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Medium</Text>
                <Text style={styles.detailValue}>{art.medium}</Text>
              </View>
            )}

            {art.dimensions && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Dimensions</Text>
                <Text style={styles.detailValue}>{art.dimensions}</Text>
              </View>
            )}
          </View>

          {art.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{art.description}</Text>
            </View>
          )}

          <MessageButton onPress={() => console.log('Message about artwork')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#002d4e',
    marginBottom: 8,
  },
  artist: {
    fontSize: 22,
    fontWeight: '500',
    color: '#002d4e',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: '#002d4e',
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailKey: {
    fontSize: 16,
    color: '#002d4e',
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    fontWeight: '500',
  },
});