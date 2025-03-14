import React, { useCallback } from 'react';
import {
  Share,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ShareResult = {
  status: 'shared' | 'dismissed';
  platform?: string;
};

export type ShareError = {
  error: Error;
};

export interface ShareButtonProps {
  /**
   * Title to be displayed in the share sheet
   */
  title?: string;
  
  /**
   * Message to be shared
   */
  message?: string;
  
  /**
   * Custom deeplink URL to be shared
   * This URL will open your app if installed or redirect to store if not
   */
  deeplinkUrl?: string;
  
  /**
   * Size of the share icon
   */
  size?: number;
  
  /**
   * Color of the share icon
   */
  color?: string;
  
  /**
   * Additional styles for the button container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Callback when sharing is completed
   */
  onShareComplete?: (result: ShareResult) => void;
  
  /**
   * Callback when sharing encounters an error
   */
  onShareError?: (error: ShareError) => void;
  
  /**
   * Optional test ID for E2E testing
   */
  testID?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'Check out this content',
  message = 'I found something you might like',
  deeplinkUrl = '',
  size = 28,
  color = '#007aff',
  style,
  onShareComplete,
  onShareError,
  testID = 'share-button',
}) => {
  // Generate a universal/deep link URL that handles both scenarios:
  // 1. Opens the app if installed
  // 2. Redirects to app store if not installed
  
  // This would typically be formatted like:
  // - On web: https://yourdomain.com/shared-content?id=xyz
  // - In app: yourapp://shared-content?id=xyz
  
  // Using Google as placeholder - replace with your actual link
  const generateShareLink = () => {
    if (deeplinkUrl) return deeplinkUrl;
    
    // Default placeholder - replace with your custom domain that handles deep linking
    // This should be configured with Universal Links (iOS) and App Links (Android)
    return 'https://example.com/shared-content?utm_source=app&utm_medium=share';
  };

  const handleShare = useCallback(async () => {
    try {
      const linkToShare = generateShareLink();
      
      // Share options with title, message and the deep link URL
      const shareOptions = {
        title,
        message: `${message} ${linkToShare}`,
        url: linkToShare, // iOS will use this instead of appending to message
      };

      // iOS-specific excluded activities
      const excludedActivityTypes =
        Platform.OS === 'ios'
          ? ['com.apple.UIKit.activity.Print', 'com.apple.UIKit.activity.AssignToContact']
          : undefined;

      const result = await Share.share(shareOptions, { excludedActivityTypes });

      if (result.action === Share.sharedAction) {
        onShareComplete?.({
          status: 'shared',
          platform: result.activityType ?? undefined,
        });
      } else if (result.action === Share.dismissedAction) {
        onShareComplete?.({ status: 'dismissed' });
      }
    } catch (error) {
      onShareError?.({
        error: error instanceof Error ? error : new Error('Share failed'),
      });
    }
  }, [title, message, deeplinkUrl, onShareComplete, onShareError]);

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={[styles.container, style]}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Share button"
    >
      <Ionicons name="share-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Android elevation
    elevation: 2,
  },
});

export default ShareButton;