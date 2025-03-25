import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import DedicatedTradeModal from './DedicatedTradeModal'; // Import the default export
import { Watch } from '../types/Watch'; // Import Watch type from the types file

interface TradeButtonProps {
  title?: string;
  watch?: Watch;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
}

export const TradeButton: React.FC<TradeButtonProps> = ({
  title = 'TRADE',
  watch,
  style,
  textStyle,
  onPress,
}) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    setModalVisible(true); // Open the modal
  };

  const buttonTitle = watch ? 'TRADE' : title;

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[styles.buttonContainer, style]}
      >
        <Animated.View
          style={[styles.buttonBackground, { transform: [{ scale: scaleValue }] }]}
        >
          <Text style={[styles.text, textStyle]}>{buttonTitle}</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Dedicated Trade Modal */}
      <DedicatedTradeModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        watch={watch}
      />
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  buttonBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002d4e',
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default TradeButton;