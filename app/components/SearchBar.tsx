import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  style?: any;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  placeholder = 'Search…',
  onSearch,
  style,
  isLoading = false,
}) => {
  const [searchText, setSearchText] = useState(initialValue);

  const clear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Ionicons name="search" size={20} color="#999" />
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={() => onSearch(searchText)}
        returnKeyType="search"
        autoCapitalize="none"
        blurOnSubmit={false}
      />

      {searchText !== '' && (
        <TouchableOpacity
          style={styles.clearBox}
          onPress={clear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
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
      android: { elevation: 1 },
    }),
  },
  iconBox: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    paddingRight: 30,
  },
  clearBox: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchBar;
