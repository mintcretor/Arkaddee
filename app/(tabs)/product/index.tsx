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
    SafeAreaView,
    Linking,
    ImageSourcePropType,
} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

// Import your components and types
import ProductCard, { Product } from '@/components/ProductCard';

interface Category {
    id: number;
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
    // ไม่จำเป็นต้องมี productData ตรงๆ แล้ว เพราะจะใช้ id ในการกรอง
}

// Interface สำหรับข้อมูลสินค้าที่จะส่งไปหน้า Detail (ควรอยู่ในไฟล์ types กลางถ้ามี)
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

    // ***** เพิ่ม State สำหรับเก็บหมวดหมู่ที่เลือก *****
    const [selectedCategory, setSelectedCategory] = useState<number>(1); // 'all' คือค่าเริ่มต้น แสดงสินค้าทั้งหมด

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
            title: 'Pocket',
            subtitle: t('Product.Portable_sensor'),
            image: require('@/assets/images/device/Arkad_WM.png'),
        },
    ];


    // All Products Data (รวมสินค้าทั้งหมดที่มี Category ID)
    // ***** เพิ่ม id: categoryId ให้กับแต่ละ Product เพื่อใช้ในการกรอง *****
    const allProducts: Product[] = [
        {
            id: 1, // เพิ่ม id
            title: ' Arkad PPV',
            category_name: t('Product.Aerator'),
            image: require('@/assets/images/product/PPV.png'),
            features: [t('Product.Purifier_Ventilation'), t('Product.Positive_pressure')],
            link: 'https://arkaddee.com/product/sng',
            path: '/product/detail',
            category: 1 // กำหนด Category ID
        },
        {
            id: 2, // เพิ่ม id
            title: 'Arkad ERV',
            category_name: t('Product.Aerator'),
            image: require('@/assets/images/product/ERV.png'),
            features: [t('Product.air_circulation'),t('Product.pressure_room')],
            link: 'https://arkaddee.com/product/erv',
            path: '/product/detail2',
            category: 2// กำหนด Category ID
        },
        {
            id: 3, // เพิ่ม id
            title: ' Arkad Portable Monitor',
            category_name: t('Product.measuring'),
            image: require('@/assets/images/device/Arkad_PBM.png'),
            features: [t('Product.Tabletop'),t('Product.device_track')],
            link: 'https://arkaddee.com/product/normal',
            path: '/product/detail3',
            category: 3 // กำหนด Category ID
        },
        {
            id: 4, // เพิ่ม id
            title: 'Pocket Sensor Pro',
            category_name: t('Product.measuring'),
            image: require('@/assets/images/device/Arkad_WM.png'),
            features: [t('Product.Portable_meter')],
            link: 'https://arkaddee.com/product/portable',
            path: '/product/detail4',
            category: 4 // กำหนด Category ID
        },
    ];

    // ***** ฟังก์ชันกรองสินค้าตามหมวดหมู่ที่เลือก *****
    const getFilteredProducts = () => {
        return allProducts.filter(product => product.category === selectedCategory);
    };


    const scrollY = useRef<Animated.Value>(new Animated.Value(0)).current;
    const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

    const [isZoomed, setIsZoomed] = useState<boolean>(false);
    const scale = useRef<Animated.Value>(new Animated.Value(1)).current;
    const translateX = useRef<Animated.Value>(new Animated.Value(0)).current;
    const translateY = useRef<Animated.Value>(new Animated.Value(0)).current;

    const baseScale = useRef<number>(1);
    const lastOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const pinchRef = useRef<PinchGestureHandler>(null);
    const panRef = useRef<PanGestureHandler>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start();
    }, []);

    // ฟังก์ชันนำทางไปยังหน้า Detail (ยังคงเหมือนเดิม)
    const navigateToProductDetail = (data: ProductDetailData) => {


        router.push({
            pathname: data.path,
            params: { product: JSON.stringify(data) },
        });

    };

    // Pinch/Pan Gesture Handlers (คงเดิม)
    const onPinchEvent = Animated.event(
        [{ nativeEvent: { scale: scale } }],
        { useNativeDriver: true }
    );

    const onPinchStateChange = (event: { nativeEvent: { oldState: State; scale: number } }) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            baseScale.current *= event.nativeEvent.scale;
            baseScale.current = Math.min(Math.max(baseScale.current, 1), 3);
            scale.setValue(baseScale.current);
            setIsZoomed(baseScale.current > 1);
            if (baseScale.current <= 1) {
                resetPan();
            }
        }
    };

    const onPanEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
        { useNativeDriver: true }
    );

    const onPanStateChange = (event: { nativeEvent: { oldState: State; translationX: number; translationY: number } }) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastOffset.current.x += event.nativeEvent.translationX;
            lastOffset.current.y += event.nativeEvent.translationY;

            const { width, height } = Dimensions.get('window');
            const maxPanX = (baseScale.current - 1) * width / 2;
            const maxPanY = (baseScale.current - 1) * height / 2;

            lastOffset.current.x = Math.min(Math.max(lastOffset.current.x, -maxPanX), maxPanX);
            lastOffset.current.y = Math.min(Math.max(lastOffset.current.y, -maxPanY), maxPanY);

            translateX.setOffset(lastOffset.current.x);
            translateX.setValue(0);
            translateY.setOffset(lastOffset.current.y);
            translateY.setValue(0);
        }
    };

    const resetPan = () => {
        lastOffset.current = { x: 0, y: 0 };
        translateX.setOffset(0);
        translateX.setValue(0);
        translateY.setOffset(0);
        translateY.setValue(0);
    };

    // ***** ฟังก์ชันจัดการการกด Category ด้านบน *****
    const handleCategoryPress = (categoryId: string) => {
        setSelectedCategory(categoryId); // อัปเดต State ของหมวดหมู่ที่ถูกเลือก
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <PanGestureHandler
                    ref={panRef}
                    onGestureEvent={onPanEvent}
                    onHandlerStateChange={onPanStateChange}
                    enabled={isZoomed}
                    simultaneousHandlers={pinchRef}
                >
                    <Animated.View style={{ flex: 1 }}>
                        <PinchGestureHandler
                            ref={pinchRef}
                            onGestureEvent={onPinchEvent}
                            onHandlerStateChange={onPinchStateChange}
                            simultaneousHandlers={panRef}
                        >
                            <Animated.View
                                style={[
                                    { flex: 1 },
                                    {
                                        transform: [
                                            { scale },
                                            { translateX },
                                            { translateY }
                                        ]
                                    }
                                ]}
                            >
                                <ScrollView
                                    style={styles.scrollView}
                                    showsVerticalScrollIndicator={false}
                                    scrollEnabled={!isZoomed}
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
                                                    selectedCategory === category.id && styles.selectedCategoryItem // เพิ่ม style เมื่อถูกเลือก
                                                ]}
                                                onPress={() => handleCategoryPress(category.id)} // เรียกใช้ฟังก์ชันเปลี่ยนหมวดหมู่
                                            >
                                                <View style={[
                                                    styles.categoryImageWrapper,
                                                    selectedCategory === category.id && styles.selectedCategoryImageWrapper
                                                ]}>
                                                    <Image source={category.image} style={styles.categoryImage} resizeMode="contain" />
                                                </View>
                                                <Text style={[
                                                    styles.categoryTitle,
                                                    selectedCategory === category.id && styles.selectedCategoryText
                                                ]}>{category.title}</Text>
                                                <Text style={[
                                                    styles.categorySubtitle,
                                                    selectedCategory === category.id && styles.selectedCategoryText
                                                ]}>{category.subtitle}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

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
                                                        description: p.features ? p.features.join(', ') : '',
                                                        image: p.image,
                                                        link: p.link,
                                                        path: p.path,
                                                    })}
                                                />
                                            </View>
                                        </View>
                                    ))}


                                </ScrollView>
                            </Animated.View>
                        </PinchGestureHandler>
                    </Animated.View>
                </PanGestureHandler>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const { width, height } = Dimensions.get('window');

const additionalStyles = StyleSheet.create({
    linkIndicator: {
        position: 'absolute',
        top: -5,
        right: -5,
        //backgroundColor: '#2563EB',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    linkText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // NEW: Styles for selected category
    selectedCategoryItem: {
       // borderColor: '#2563EB', // สีขอบเมื่อถูกเลือก
        borderWidth: 2,
        borderRadius: 16, // ต้องปรับตาม borderRadius ของ categoryItem
    },
    selectedCategoryImageWrapper: {

    },
    selectedCategoryText: {
        color: '#2563EB', // สีตัวอักษรเมื่อถูกเลือก
        fontWeight: 'bold',
    },
});

const styles = StyleSheet.create({
    ...additionalStyles,
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    scrollView: {
        flex: 1,
    },
    productSection: {
        padding: 20,
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
       // backgroundColor: '#2563EB',
        alignSelf: 'center',
    },
    productGrid: {
        flexDirection: 'column',
    },
    wideInfoBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
        alignSelf: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    airQualitySection: {
        marginTop: 20,
    },
    airQualityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    airQualityImages: {
        flexDirection: 'column',
    },
    warrantySection: {
        marginBottom: 50,
    },
    warrantyCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    warrantyCardsRowSecond: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 20,
    },

    topCategoriesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingVertical: 20,
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
        paddingVertical: 8, // เพิ่ม padding เพื่อให้มีพื้นที่สำหรับ border
        paddingHorizontal: 4,
        borderRadius: 16, // ควรมีค่าเท่ากับ selectedCategoryItem
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
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 4,
    },
    categorySubtitle: {
        fontSize: 10,
        textAlign: 'center',
    },

    featuredProductSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    featuredProductCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginTop: 20,
        overflow: 'hidden',
    },
    featuredProductImageContainer: {
        height: 250,
        backgroundColor: '#F8F8F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featuredProductImage: {
        width: '90%',
        height: '90%',
    },
    featuredProductContent: {
        padding: 20,
        alignItems: 'center',
    },
    featuredProductName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 8,
    },
    featuredProductTagline: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 12,
        textAlign: 'center',
    },
    featuredProductDescription: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    featuredProductButton: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        width: '80%',
    },
});

export default Index;