// app/components/LikeList.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LikeListProps {
  initialLikes: number;
  isLiked?: boolean;
  watchId: string;
  style?: StyleProp<ViewStyle>;
}

export const LikeList: React.FC<LikeListProps> = ({
  initialLikes,
  isLiked = false,
  style,
}) => {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}m`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentWrapper}>
        <Ionicons
          name={isLiked ? 'bookmark' : 'bookmark-outline'}
          size={15}
          color="#002d4e"
          style={styles.icon}
        />
        <Text style={styles.likeText}>
          {formatCount(initialLikes)}
          <Text style={styles.label}> {initialLikes === 1 ? 'Like' : 'Likes'}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    alignSelf: 'flex-start',
    // Removed absolute positioning so it aligns inline with siblings
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    
  },
  icon: {
    
    marginRight: 6,
    opacity: 0.9,
    color: '#002d4e',
  },
  likeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#002d4e',
    letterSpacing: -0.3,
  },
  label: {
    fontWeight: '400',
    color: '#002d4e',
    opacity: 0.7,
  },
});
