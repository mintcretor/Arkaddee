import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    StatusBar,
    ImageSourcePropType,
    SafeAreaView,
    Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

// Import your components and types
import ProductCard, { Product } from '@/components/ProductCard';

interface Category {
    id: number;
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
}

interface ProductDetailData {
    id: number;
    title: string;
    name?: string;
    tagline?: string;
    description?: string;
    image: ImageSourcePropType;
    features?: string[];
    link?: string;
    subtext?: string;
    path: string;
}

const Index: React.FC = () => {
    const { t } = useTranslation();

    const [selectedCategory, setSelectedCategory] = useState<number>(1);

    // Data for top categories
    const topCategories: Category[] = [
        {
            id: 1,
            title: 'PPV',
            subtitle: t('Product.Positive_pressure_air_supply_system'),
            image: require('@/assets/images/product/PPV.png'),
        },
        {
            id: 2,
            title: 'ERV',
            subtitle: t('Product.ERV_heat_recovery'),
            image: require('@/assets/images/product/ERV.png'),
        },
        {
            id: 3,
            title: 'Monitor',
            subtitle: t('Product.Desktop_sensor'),
            image: require('@/assets/images/device/Arkad_PBM.png'),
        },
        {
            id: 4,
            title: 'Arkad Dust Walker',
            subtitle: t('Product.Portable_sensor'),
            image: require('@/assets/images/device/Arkad_WM.png'),
        },
    ];

    // All Products Data
    const allProducts: Product[] = [
        {
            id: 1,
            title: ' Arkad PPV',
            category_name: t('Product.Aerator'),
            image: require('@/assets/images/product/PPV.png'),
            features: [t('Product.Purifier_Ventilation'), t('Product.Positive_pressure_env')],
            link: 'https://arkaddee.com/product/sng',
            path: '/product/detail',
            category: 1
        },
        {
            id: 2,
            title: 'Arkad ERV',
            category_name: t('Product.Aerator'),
            image: require('@/assets/images/product/ERV.png'),
            features: [t('Product.air_circulation'), t('Product.pressure_room')],
            link: 'https://arkaddee.com/product/erv',
            path: '/product/detail2',
            category: 2
        },
        {
            id: 3,
            title: ' Arkad Portable Monitor',
            category_name: t('Product.measuring'),
            image: require('@/assets/images/device/Arkad_PBM.png'),
            features: [t('Product.Tabletop'), t('Product.device_track')],
            link: 'https://arkaddee.com/product/normal',
            path: '/product/detail3',
            category: 3
        },
        {
            id: 4,
            title: 'Arkad Dust Walker',
            category_name: t('Product.measuring'),
            image: require('@/assets/images/device/Arkad_WM.png'),
            features: [t('Product.Portable_meter')],
            link: 'https://arkaddee.com/product/portable',
            path: '/product/detail4',
            category: 4
        },
    ];

    const getFilteredProducts = () => {
        return allProducts.filter(product => product.category === selectedCategory);
    };

    const scrollY = useRef<Animated.Value>(new Animated.Value(0)).current;
    const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start();
    }, []);

    const navigateToProductDetail = (data: ProductDetailData) => {
        router.push({
            pathname: data.path,
            params: { product: JSON.stringify(data) },
        });
    };

    const handleCategoryPress = (categoryId: number) => {
        setSelectedCategory(categoryId);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
               backgroundColor="#ffffff"
               translucent={true}
                />
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* Top Category Icons */}
                    <View style={styles.topCategoriesContainer}>
                        {topCategories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryItem,
                                    selectedCategory === category.id && styles.selectedCategoryItem
                                ]}
                                onPress={() => handleCategoryPress(category.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.categoryImageWrapper,
                                    selectedCategory === category.id && styles.selectedCategoryImageWrapper
                                ]}>
                                    <Image source={category.image} style={styles.categoryImage} resizeMode="contain" />
                                </View>
                                <Text
                                    style={[
                                        styles.categoryTitle,
                                        selectedCategory === category.id && styles.selectedCategoryText
                                    ]}
                                    numberOfLines={2}
                                >
                                    {category.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Products List */}
                    {getFilteredProducts().map((product) => (
                        <View key={product.id} style={styles.productGrid}>
                            <View style={styles.productSection}>
                                <Text style={styles.sectionTitle}>
                                    {t('Product.category')} : {product.category_name}
                                </Text>
                                <View style={styles.titleUnderline} />
                                <ProductCard
                                    product={product}
                                    onPress={(p: Product) => navigateToProductDetail({
                                        id: p.id,
                                        title: p.title,
                                        description: p.features ? p.features.join(',') : '',
                                        image: p.image,
                                        link: p.link,
                                        path: p.path,
                                    })}
                                />
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //backgroundColor: '#F7F7F7',
        marginTop: Platform.OS === 'ios' ? 35 : 25,
    },
    scrollView: {
        flex: 1,
    },
    productSection: {
        padding: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#333333',
    },
    titleUnderline: {
        width: 80,
        height: 3,
        marginBottom: 20,
        backgroundColor: '#2563EB',
        alignSelf: 'center',
    },
    productGrid: {
        flexDirection: 'column',
    },
    topCategoriesContainer: {
        flexDirection: 'row',
        height: 150,
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingVertical: 20,
        marginTop: 0,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    categoryItem: {
        alignItems: 'center',
        width: Dimensions.get('window').width / 4 - 20,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryImageWrapper: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryImage: {
        width: '80%',
        height: '80%',
    },
    categoryTitle: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 4,
        color: '#333',
    },
    selectedCategoryItem: {
        borderColor: '#2563EB',
        backgroundColor: '#F0F7FF',
    },
    selectedCategoryImageWrapper: {
        borderColor: '#2563EB',
        borderWidth: 2,
    },
    selectedCategoryText: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
});

export default Index;