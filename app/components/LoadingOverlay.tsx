import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
}

// This component is intentionally empty to prevent any loading indicators from showing
export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  // Always return null regardless of visible prop
  return null;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  }
});