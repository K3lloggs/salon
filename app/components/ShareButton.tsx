import React, { useCallback } from 'react';
import {
  Share,
  TouchableOpacity,
  Platform,
} from 'react-native';
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
      // Create a direct URI scheme link (works in production)
      const deepLink = `watchsalon://watch/${watchId}`;
      
      // App store link
      const appStoreLink = "https://apps.apple.com/us/app/watch-scl/id6743322357";
      
      // Create share content
      const title = `${watchBrand} ${watchModel}`;
      
      // Create platform-specific message
      let message;
      if (Platform.OS === 'ios') {
        // iOS users will see the URL as a separate clickable link
        message = `Check out this ${watchBrand} ${watchModel} at Shreve, Crump & Low!`;
      } else {
        // Android users need the URL in the message text
        message = `Check out this ${watchBrand} ${watchModel} at Shreve, Crump & Low!\n\nOpen in app: ${deepLink}\n\nDon't have the app? Download it here: ${appStoreLink}`;
      }
      
      // Configure share options
      const shareOptions = {
        title,
        message,
      };

      // For iOS, include the URL directly in the message
      if (Platform.OS === 'ios') {
        shareOptions.message += `\n\nOpen in app: ${deepLink}`;
      }

      // iOS-specific excluded activities
      const excludedActivityTypes = Platform.OS === 'ios' 
        ? ['com.apple.UIKit.activity.Print', 'com.apple.UIKit.activity.AssignToContact']
        : undefined;
        
      // Perform the share action
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