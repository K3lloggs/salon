import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark } = useTheme();
  
  // Define theme-specific colors
  const backgroundColor = isDark ? '#333' : '#F5F5F7';
  const textColor = isDark ? '#FFF' : '#002d4e';
  const iconColor = isDark ? '#81b0ff' : '#002d4e';
  const labelOpacity = isDark ? 0.8 : 0.7;

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
    <View style={[
      styles.container, 
      { backgroundColor },
      style
    ]}>
      <View style={styles.contentWrapper}>
        <Ionicons
          name={isLiked ? 'bookmark' : 'bookmark-outline'}
          size={15}
          color={iconColor}
          style={[styles.icon, { color: iconColor }]}
        />
        <Text style={[styles.likeText, { color: textColor }]}>
          {formatCount(initialLikes)}
          <Text style={[styles.label, { color: textColor, opacity: labelOpacity }]}>
            {initialLikes === 1 ? ' Like' : ' Likes'}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignSelf: 'flex-start',
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
  },
  likeText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  label: {
    fontWeight: '400',
  },
});

export default LikeList;