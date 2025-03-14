// app/FilterScreen.tsx
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSortContext, SortOption } from '../context/SortContext';

const filterOptions: { label: string; value: SortOption }[] = [
  { label: 'Price: High to Low', value: 'highToLow' },
  { label: 'Price: Low to High', value: 'lowToHigh' },
];

export default function FilterScreen() {
  const { sortOption, setSortOption } = useSortContext();
  const router = useRouter();

  const handleOptionPress = (option: SortOption) => {
    setSortOption(option);
  };

  const handleApply = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Filter Options</Text>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value || 'default'}
            style={styles.optionContainer}
            onPress={() => handleOptionPress(option.value)}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            {sortOption === option.value ? (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            ) : (
              <Ionicons name="radio-button-off" size={24} color="#ccc" />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#002d4e',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    marginTop: 32,
    backgroundColor: '#002d4e',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
