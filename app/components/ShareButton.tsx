import React, { useCallback } from 'react';
import { Share, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShareButton = ({
  watchId,
  watchBrand = '',
  watchModel = '',
  size = 28,
  color = '#007aff',
  style,
  testID = 'share-button',
}) => {
  const handleShare = useCallback(async () => {
    try {
      const deepLink = `watchsalon://watch/${watchId}`;
      const appStoreLink = "https://apps.apple.com/us/app/watch-scl/id6743322357";
      
      const title = `${watchBrand} ${watchModel}`;

      let message;
      if (Platform.OS === 'ios') {
        message = `Check out this ${watchBrand} at SCL CPO`;
        message += `\n\n${deepLink}`;
      } else {
        message = `Check out this ${watchBrand} at SCL CPO\n\nOpen in app: ${deepLink}\n\nDon't have the app? Download it here: ${appStoreLink}`;
      }

      const shareOptions = {
        title,
        message,
      };

      const excludedActivityTypes = Platform.OS === 'ios' 
        ? ['com.apple.UIKit.activity.Print', 'com.apple.UIKit.activity.AssignToContact']
        : undefined;

      await Share.share(shareOptions, { excludedActivityTypes });

    } catch (error) {
      console.error("Share error:", error);
    }
  }, [watchId, watchBrand, watchModel]);

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={[style]}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Share button"
    >
      <Ionicons name="share-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default ShareButton;
