// app/components/LikeCounter.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
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
  
  // Subscribe to real-time updates from Firestore for this watch's likes
  useEffect(() => {
    // Create a reference to the watch document
    const watchRef = doc(db, 'Watches', watch.id);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(watchRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const watchData = docSnapshot.data();
        if (watchData && typeof watchData.likes === 'number') {
          setLikeCount(watchData.likes);
        }
      }
    }, (error) => {
      console.error("Error getting watch document:", error);
    });
    
    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, [watch.id]);

  const toggleLike = useCallback(async () => {
    try {
      // Reference to the Firestore document for this watch
      const watchRef = doc(db, 'Watches', watch.id);
      
      if (liked) {
        // If already liked, decrement like count and remove from favorites
        await updateDoc(watchRef, { likes: increment(-1) });
        removeFavorite(watch.id);
      } else {
        // Otherwise, increment like count and add to favorites
        await updateDoc(watchRef, { likes: increment(1) });
        addFavorite(watch);
      }
      // We don't need to manually update likeCount anymore since the
      // onSnapshot listener will update it automatically
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
    color: '#000000', // Changed to black as requested
  },
  likedText: {
    color: '#000000', // Both states use black text
  },
});

export default LikeCounter;