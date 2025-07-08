import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { useTranslation } from 'react-i18next';

// Define the Product interface
export interface Product {
  id:number;
  title: string;
  category_name:string;
  image: ImageSourcePropType; // Use ImageSourcePropType for require() images
  features: string[];
  link: string;
  category:number;
  path:string;
}

// Define the props for ProductCard component
interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void; // onPress now expects the full product object
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)} // Pass the whole product object
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={product.image} style={styles.productImage} resizeMode="contain" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>
        {product.features && product.features.map((feature, idx) => (
          <Text key={idx} style={styles.feature}>• {feature}</Text>
        ))}
        <TouchableOpacity style={styles.moreInfoBtn} onPress={() => onPress(product)}>
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
    backgroundColor: '#F8F8F8',
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

export default ProductCard;