import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import MessageScreen from '../(screens)/MessageScreen'; // Ensure that the file exists at this path or update the path accordingly

interface MessageButtonProps {
  title?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
}

export const MessageButton: React.FC<MessageButtonProps> = ({
  title = 'Contact Sales Team',
  style,
  textStyle,
  onPress,
}) => {
  const [isModalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[styles.buttonContainer, style]}
      >
        <View style={styles.gradientWrapper}>
          {/* SVG for the linear gradient border */}
          <Svg width="100%" height="100%" style={RNStyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#007AFF" />
                <Stop offset="0.33" stopColor="#0056b3" />
                <Stop offset="0.66" stopColor="#002d4e" />
                <Stop offset="1" stopColor="#007AFF" />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              rx="12"
              ry="12"
              stroke="url(#grad)"
              strokeWidth="4"
              fill="none"
            />
          </Svg>
          <View style={styles.innerContainer}>
            <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <MessageScreen visible={isModalVisible} onClose={() => setModalVisible(false)} />
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
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  gradientWrapper: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    borderRadius: 8, // (12 - 4 for the border thickness)
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4, // creates space for the gradient border
  },
  buttonText: {
    color: '#002d4e',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});
