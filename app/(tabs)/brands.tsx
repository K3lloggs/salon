import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { FixedHeader } from '../components/FixedHeader';
import Colors from '../../constants/Colors';

interface Brand {
  id: string;
  name: string;
  models: number;
  image?: string;
}

interface BrandCardProps {
  brand: Brand;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardWrapper,
        pressed && { opacity: 0.9 },
      ]}
      onPress={() =>
        router.push({
          pathname: `../Brands/${brand.id}`,
          params: { brandName: brand.name },
        })
      }
    >
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brand.name}
            </Text>
            <Text style={styles.modelsCount}>
              {brand.models} Models
            </Text>
          </View>
          <View style={styles.imageContainer}>
            {brand.image && (
              <Image
                source={{ uri: brand.image }}
                style={styles.brandImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function BrandsScreen() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Priority brands in the desired order
  const priorityBrands = ['Rolex','Patek Philippe','Audemars Piguet','A. Lange & Söhne'];

  const fetchBrands = async () => {
    try {
      const watchesCollection = collection(db, 'Watches');
      const snapshot = await getDocs(watchesCollection);

      const rawData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const images = Array.isArray(data.image) ? data.image : [data.image];
        return {
          brandName: data.brand || '',
          firstImage: images && images[0] ? images[0] : null,
        };
      });

      const brandGroups: Brand[] = [];
      rawData.forEach((item) => {
        const existingBrand = brandGroups.find(
          (b) => b.name.toLowerCase() === item.brandName.toLowerCase()
        );
        if (existingBrand) {
          existingBrand.models += 1;
        } else {
          brandGroups.push({
            id: item.brandName,
            name: item.brandName,
            models: 1,
            image: item.firstImage || undefined,
          });
        }
      });

      // Custom sorting function that puts priority brands first,
      // then sorts the rest alphabetically
      const sortedBrands = brandGroups.sort((a, b) => {
        // Check if either brand is in the priority list
        const aIndex = priorityBrands.findIndex(
          brand => brand.toLowerCase() === a.name.toLowerCase()
        );
        const bIndex = priorityBrands.findIndex(
          brand => brand.toLowerCase() === b.name.toLowerCase()
        );

        // If both are priority brands, sort by their order in the priority list
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only a is a priority brand, it comes first
        if (aIndex !== -1) {
          return -1;
        }
        
        // If only b is a priority brand, it comes first
        if (bIndex !== -1) {
          return 1;
        }
        
        // If neither is a priority brand, sort alphabetically
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      setBrands(sortedBrands);
      setFilteredBrands(sortedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBrands(brands);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = brands.filter((brand) =>
      brand.name.toLowerCase().includes(query)
    );
    setFilteredBrands(filtered);
  }, [searchQuery, brands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrands();
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Always show the header, never show loading indicator
  return (
    <View style={styles.container}>
      <FixedHeader 
        title="Brands"
        showSearch={true}
        showFavorites={true}
        showFilter={false}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        currentScreen="brands"
      />
      
      <FlatList
        data={loading ? [] : filteredBrands}
        renderItem={({ item }) => <BrandCard brand={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryBlue}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.offWhite 
  },
  listContent: { 
    padding: 10 
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.offWhite,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#003366',
    shadowOpacity: .1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    backgroundColor: '#FCFCFC', // Even whiter, but still maintaining a slight off-white tint
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardContent: {
    flexDirection: 'row',
    height: Dimensions.get('window').height / 6,
  },
  textContainer: {
    flex: 3,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#FCFCFC', // Match card background
    overflow: 'hidden',
  },
  brandImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryBlue,
    letterSpacing: 0.2,
  },
  modelsCount: {
    fontSize: 16,
    color: '#666',
    letterSpacing: 0.2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});