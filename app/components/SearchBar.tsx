import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  placeholder = 'Search...',
  onSearch,
  style
}) => {
  const [searchText, setSearchText] = useState(initialValue);

  const handleTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleClearSearch = () => {
    setSearchText('');
    // Don't call onSearch here to prevent re-render
  };

  const handleSearchSubmit = () => {
    onSearch(searchText);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color="#999" />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={handleTextChange}
        onSubmitEditing={handleSearchSubmit}
        returnKeyType="search"
        clearButtonMode="never"
        autoCapitalize="none"
      />
      {searchText ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSearch}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIconContainer: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchBar;