// app/components/LikeCounter.tsx
import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useFavorites } from '../context/FavoritesContext';
import { Watch } from '../types/Watch';

interface LikeCounterProps {
  watch: Watch; // Full watch object
  initialLikes: number;
}

const LikeCounter: React.FC<LikeCounterProps> = ({ watch, initialLikes }) => {
  const [likeCount, setLikeCount] = useState(initialLikes);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Determine if this watch is already liked (favorited)
  const liked = isFavorite(watch.id);

  const toggleLike = useCallback(async () => {
    try {
      // Reference to the Firestore document for this watch
      const watchRef = doc(db, 'Watches', watch.id);
      
      if (liked) {
        // If already liked, decrement like count and remove from favorites
        await updateDoc(watchRef, { likes: increment(-1) });
        setLikeCount(prev => prev - 1);
        removeFavorite(watch.id);
      } else {
        // Otherwise, increment like count and add to favorites
        await updateDoc(watchRef, { likes: increment(1) });
        setLikeCount(prev => prev + 1);
        addFavorite(watch);
      }
    } catch (error) {
      console.error('Error updating like count:', error);
    }
  }, [watch, liked, removeFavorite, addFavorite]);

  return (
    <TouchableOpacity
      onPress={toggleLike}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={25}
        color={liked ? '#ff0000' : '#002d4e'}
      />
      <Text style={[styles.likeText, liked && styles.likedText]}>
        {likeCount}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // Positioned at the top-right of the image container
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002d4e',
  },
  likedText: {
    color: '#00000',
  },
});

export default LikeCounter;