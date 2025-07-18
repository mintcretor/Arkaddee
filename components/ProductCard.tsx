import React from 'react'; // Make sure React is imported for React.memo
import { StyleSheet, View, Text, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { useTranslation } from 'react-i18next';

// Define the Product interface
export interface Product {
  id: number;
  title: string;
  category_name: string;
  image: ImageSourcePropType; // Use ImageSourcePropType for require() images
  features: string[];
  link: string;
  category: number;
  path: string;
}

// Define the props for ProductCard component
interface ProductCardProps {
  product: Product;
  // onPress now expects the full product object.
  // We're passing a specific type for navigation to make it clearer what's expected.
  // This type (ProductDetailNavigationParams) should be defined in Index.tsx or a shared types file.
  onPress: (params: { id: number; path: string }) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { t } = useTranslation();

  // Memoize the onPress handler for the card itself to prevent unnecessary re-renders
  // if 'onPress' or 'product' objects change structurally but not functionally.
  const handleCardPress = React.useCallback(() => {
    // Only pass the essential data for navigation: id and path
    onPress({ id: product.id, path: product.path });
  }, [onPress, product.id, product.path]); // Dependencies for useCallback

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={handleCardPress} // Use the memoized handler
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {/*
          IMPORTANT: Ensure images loaded via require() are optimized (resized and compressed)
          This is a critical step for iPad performance, not directly fixable in code here.
        */}
        <Image source={product.image} style={styles.productImage} resizeMode="contain" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>
        {product.features && product.features.map((feature, idx) => (
          <Text key={idx} style={styles.feature}>• {feature}</Text>
        ))}
        {/* The "More Info" button also triggers the same navigation */}
        <TouchableOpacity style={styles.moreInfoBtn} onPress={handleCardPress}>
          <Text style={styles.btnText}>{t('Product.Additional_information')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    paddingLeft: 8,
  },
  moreInfoBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

// --- Key Optimization ---
// Use React.memo to prevent unnecessary re-renders of the ProductCard.
// This means the component will only re-render if its props (product or onPress) change.
export default React.memo(ProductCard);