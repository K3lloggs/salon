import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';

/**
 * Props for ExternalLink component.
 */
interface ExternalLinkProps {
  /** The URL that should be opened when the link is pressed. */
  href: string;
  /** The children can be a string or any React element(s). */
  children: React.ReactNode;
  /** Optional style props that are applied to the container. */
  style?: StyleProp<ViewStyle>;
}

/**
 * A component that opens an external URL when pressed.
 */
export default function ExternalLink({ href, children, style }: ExternalLinkProps) {
  /**
   * Handle pressing the link by using the React Native Linking API.
   */
  const handlePress = () => {
    Linking.openURL(href);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: '#007aff', // iOS-style link color
    textDecorationLine: 'underline',
  },
});
