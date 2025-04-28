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
import { useThemedStyles } from '../hooks/useThemedStyles';

interface Brand {
  id: string;
  name: string;
  models: number;
  image?: string;
  // Add premium image from most expensive watch of this brand
  premiumImage?: string;
  // Track max price
  maxPrice?: number;
}

interface BrandCardProps {
  brand: Brand;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const router = useRouter();
  const { isDark, colors } = useThemedStyles();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardWrapper,
        {
          backgroundColor: colors.background,
          shadowColor: isDark ? '#000' : '#003366',
        },
        pressed && { opacity: 0.9 },
      ]}
      onPress={() =>
        router.push({
          pathname: `../Brands/${brand.id}`,
          params: { brandName: brand.name },
        })
      }
    >
      <View style={[styles.card, { 
        backgroundColor: colors.card,
        borderColor: colors.border
      }]}>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={[styles.brandName, { color: colors.primary }]} numberOfLines={1}>
              {brand.name}
            </Text>
            <Text style={[styles.modelsCount, { color: isDark ? '#aaa' : '#666' }]}>
              {brand.models} Models
            </Text>
          </View>
          <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
            {/* Use the premium image (from most expensive watch) if available */}
            {(brand.premiumImage || brand.image) && (
              <Image
                source={{ uri: brand.premiumImage || brand.image }}
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
  const { styles: themeStyles, colors } = useThemedStyles();

  // Priority brands in the desired order
  const priorityBrands = ['Rolex','Patek Philippe','Audemars Piguet','A. Lange & Söhne'];

  const fetchBrands = async () => {
    try {
      const watchesCollection = collection(db, 'Watches');
      const snapshot = await getDocs(watchesCollection);

      // Create a map to store the most expensive watch per brand
      const brandMap: { [key: string]: Brand } = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const brandName = data.brand || '';
        const price = typeof data.price === 'number' ? data.price : 0;
        const images = Array.isArray(data.image) ? data.image : [data.image];
        
        // Get first image for default display
        const firstImage = images && images[0] ? images[0] : null;
        
        // Normalize the brand name for use as a key
        const brandKey = brandName.toLowerCase();
        
        if (!brandMap[brandKey]) {
          // First watch of this brand - initialize
          brandMap[brandKey] = {
            id: brandName,
            name: brandName,
            models: 1,
            image: firstImage,
            premiumImage: firstImage, // Default premium image
            maxPrice: price
          };
        } else {
          // Add to model count
          brandMap[brandKey].models += 1;
          
          // Check if this watch is more expensive than current max
          if (price > (brandMap[brandKey].maxPrice || 0)) {
            // Update max price and premium image
            brandMap[brandKey].maxPrice = price;
            // Use first image from most expensive watch
            brandMap[brandKey].premiumImage = firstImage;
          }
        }
      });

      // Convert the object to an array for sorting and display
      const brandsArray = Object.values(brandMap);

      // Custom sorting function that puts priority brands first,
      // then sorts the rest alphabetically
      const sortedBrands = brandsArray.sort((a, b) => {
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
    <View style={[styles.container, themeStyles.container]}>
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
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  listContent: { 
    padding: 10 
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowOpacity: .1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
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
    overflow: 'hidden',
  },
  brandImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modelsCount: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});