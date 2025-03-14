import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the EditScreenInfo component.</Text>
      <Text style={styles.pathText}>Path: {path}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  pathText: {
    fontSize: 14,
    color: '#888',
  },
});
