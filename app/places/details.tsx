import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    Animated,
    StatusBar,
    SafeAreaView,
    Dimensions,
    Linking,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    ActivityIndicator,
    StyleSheet,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { fetchRestaurantById, fetchAirRestaurantById } from '@/api/baseapi';
import { BASEAPI_CONFIG } from '@/config';
import { useAuth } from '@/hooks/useAuth';
import { BackHandler } from 'react-native';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
// Import the review components
import { ReviewsSection, WriteReviewModal, StarRating } from '@/components/ReviewComponents';
// Import our new OpeningHours component
import OpeningHours from '@/components/store_hours';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HEADER_HEIGHT = 50;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const TOP_SPACING = Platform.OS === 'ios' ? 0 : 0;
const { width, height } = Dimensions.get('window');

// เพิ่มฟังก์ชัน API สำหรับ Favorite
const addFavorite = async (restaurantId: any) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        }

        // แก้ไข URL และไม่ต้องส่ง body
        const response = await fetch(`${BASEAPI_CONFIG.baseUrl}/stores/favorite/${restaurantId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
            // ไม่ต้องส่ง body เพราะ restaurantId มาจาก URL parameter แล้ว
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to add favorite');
        }

        return data;
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
};

const removeFavorite = async (restaurantId: any) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        }

        const response = await fetch(`${BASEAPI_CONFIG.baseUrl}/stores/favorite/${restaurantId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // เพิ่ม authorization header ถ้าจำเป็น
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove favorite');
        }

        return await response.json();
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
};

const ShopDetails = () => {
    const { id } = useLocalSearchParams();
    const { user, signOut } = useAuth(); // ดึงข้อมูล user จาก auth context
    const { recentlyViewed = [], clearRecentlyViewed, addToRecentlyViewed } = useRecentlyViewed() as { recentlyViewed?: any[]; clearRecentlyViewed: () => Promise<void> };; // เพิ่มบรรทัดนี้
    const [imagesPreloaded, setImagesPreloaded] = useState(false);

    const [restaurantBaseInfo, setRestaurantBaseInfo] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [environmentalData, setEnvironmentalData] = useState({
        temperature: null,
        humidity: null,
        pm25: null,
        co2: null,
        tvoc: null,
        hcho: null
    });
    const { t } = useTranslation();

    const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const flatListRef = useRef(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // เพิ่ม state สำหรับรูปภาพในรีวิว
    const [reviewImageModalVisible, setReviewImageModalVisible] = useState(false);
    const [selectedReviewImageIndex, setSelectedReviewImageIndex] = useState(0);
    const [reviewImages, setReviewImages] = useState([]);

    const loadInitialData = async () => {
        try {

            setLoading(true);
            const details = await fetchRestaurantById(id);
            // แยกข้อมูลเซ็นเซอร์ออกจากข้อมูลหลัก
            const { environmentalMetrics, ...baseInfo } = details;
            // ตั้งค่าข้อมูลพื้นฐานของร้าน
            setRestaurantBaseInfo(baseInfo);
            //console.log('Restaurant Base Info:', baseInfo);
            // ตั้งค่าสถานะ favorite
            setIsFavorite(baseInfo.is_favorite || false);

            // ตั้งค่าข้อมูลเซ็นเซอร์
            if (environmentalMetrics) {
                setEnvironmentalData({
                    temperature: environmentalMetrics.temperature || null,
                    humidity: environmentalMetrics.humidity || null,
                    pm25: environmentalMetrics.pm25 === null ? 'X' : environmentalMetrics.pm25,
                    co2: environmentalMetrics.co2 || null,
                    tvoc: environmentalMetrics.tvoc || null,
                    hcho: environmentalMetrics.hcho || null
                });
            }
            await addToRecentlyViewed(baseInfo);
            setLastUpdateTime(Date.now());
            setLastUpdate(Date.now());

        } catch (error) {
            //  console.error('Failed to load place details:', error);
        } finally {
            setLoading(false);
        }
    };
    useFocusEffect(
        React.useCallback(() => {
            // ถ้ามีฟังก์ชัน refreshUser ใน useAuth ให้เรียก
            loadInitialData();
            // หรือจะ fetch user ใหม่จาก API ตรงนี้ก็ได้
        }, [])
    );
    useEffect(() => {
        const backAction = () => {

            // ตรวจสอบว่าสามารถกลับได้
            if (router.canGoBack()) {
                router.back();
            } else {
                // ถ้าไม่มีที่กลับ ให้ไปหน้าหลัก
                router.replace('/(tabs)/home');
            }

            return true; // ป้องกัน default behavior
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove(); // ล้างเมื่อ component unmount
    }, []);


    // ฟังก์ชันสำหรับจัดการ favorite - ปรับปรุงแล้ว
    const handleFavoritePress = async () => {
        if (!user || user.authType === 'guest') {
            Alert.alert(
                t('common.guestTitle'),
                t('common.guestReviewOrFav'),
                [
                    { text: t('common.cancel'), style: 'cancel' },

                    {
                        text: t('common.signup'), onPress: async () => {
                            //await signOut();
                            //await clearRecentlyViewed()

                            router.push('/(auth)/register/register');
                        }

                    }
                ]
            );
            return;
        }

        try {
            setFavoriteLoading(true);

            if (isFavorite) {
                // ลบออกจาก favorite
                await removeFavorite(id);
                setIsFavorite(false);
                Alert.alert(t('store.success')
                    , t('store.removedFromFavorites'));
            } else {
                // เพิ่มเข้า favorite
                await addFavorite(id);
                setIsFavorite(true);
                Alert.alert(t('store.success')
                    , t('store.addedToFavorites'));
            }
        } catch (error) {
            console.error('Failed to update favorite:', error);
            Alert.alert(t('store.error')
                , t('store.failedToUpdateFavorite'));
        } finally {
            setFavoriteLoading(false);
        }
    };

    const loadSensorData = async () => {
        try {
            // คุณอาจต้องสร้าง API endpoint ใหม่ที่ส่งเฉพาะข้อมูลเซ็นเซอร์
            const response = await fetchAirRestaurantById(id);

            // อัปเดตเฉพาะข้อมูลเซ็นเซอร์
            if (response.environmentalMetrics) {
                setEnvironmentalData(prevData => ({
                    temperature: response.environmentalMetrics.temperature || prevData.temperature,
                    humidity: response.environmentalMetrics.humidity || prevData.humidity,
                    pm25: response.environmentalMetrics.pm25 === null ? '...' : response.environmentalMetrics.pm25,
                    co2: response.environmentalMetrics.co2 || prevData.co2,
                    tvoc: response.environmentalMetrics.tvoc || prevData.tvoc,
                    hcho: response.environmentalMetrics.hcho || prevData.hcho
                }));

                setLastUpdateTime(new Date());
            }
        } catch (error) {
            //console.error('Failed to load sensor data:', error);
        }
    };

    useEffect(() => {
        if (id) {
            loadInitialData();
        }
    }, [id]);

    useEffect(() => {
        if (!id || !restaurantBaseInfo) return;

        // เริ่มต้น polling ทุก 30 วินาที
        const pollingInterval = setInterval(() => {
            loadSensorData();
        }, 30000); // 30 วินาที

        // ล้างการตั้งเวลาเมื่อคอมโพเนนต์ถูกทำลาย
        return () => clearInterval(pollingInterval);
    }, [id, restaurantBaseInfo]);

    const restaurantsData = React.useMemo(() => {
        if (!restaurantBaseInfo) return null;
        return {
            ...restaurantBaseInfo,
            environmentalMetrics: environmentalData
        };
    }, [restaurantBaseInfo, environmentalData]);
    useEffect(() => {
        if (modalVisible && restaurantsData && restaurantsData.images && restaurantsData.images.length > 0 && !imagesPreloaded) {
            console.log("Preloading images for FullScreenImageModal...");
            const preloadPromises = restaurantsData.images.map(imagePath =>
                Image.prefetch(`${BASEAPI_CONFIG.UrlImg}${imagePath}`)
            );

            Promise.all(preloadPromises)
                .then(() => {
                    console.log("All modal images preloaded.");
                    setImagesPreloaded(true);
                })
                .catch(error => {
                    console.error("Error preloading modal images:", error);
                    // แม้ว่าการโหลดล่วงหน้าจะล้มเหลว ก็ยังคงอนุญาตให้ Modal เปิดได้
                    setImagesPreloaded(true);
                });
        }
    }, [modalVisible, restaurantsData, imagesPreloaded]);

    useEffect(() => {
        if (reviewImageModalVisible && reviewImages.length > 0) {
            console.log("Preloading images for ReviewImageModal...");
            const preloadPromises = reviewImages.map(imageUri =>
                Image.prefetch(imageUri)
            );

            Promise.all(preloadPromises)
                .then(() => {
                    console.log("All review images preloaded.");
                    // คุณอาจต้องการ state แยกต่างหากสำหรับการโหลดรูปภาพรีวิว
                    // เพื่อความง่าย จะปล่อยให้โหลดเมื่อเปิด หรือเพิ่ม state เฉพาะ
                })
                .catch(error => {
                    console.error("Error preloading review images:", error);
                });
        }
    }, [reviewImageModalVisible, reviewImages]);
    // Default coordinates for the map (should be replaced with actual restaurant location)
    const defaultLocation = {
        latitude: 18.7883, // Default for Chiang Mai
        longitude: 98.9853,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    // Use restaurant coordinates if available, otherwise use default
    const mapRegion = restaurantsData ? {
        latitude: restaurantsData.latitude ? parseFloat(restaurantsData.latitude) : defaultLocation.latitude,
        longitude: restaurantsData.longitude ? parseFloat(restaurantsData.longitude) : defaultLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    } : defaultLocation;

    const openGoogleMapsDirections = () => {
        if (!restaurantsData) return;

        const { latitude, longitude } = mapRegion;
        const label = encodeURIComponent(restaurantsData.name || "");

        if (Platform.OS === 'ios') {
            // Try Google Maps first
            const googleUrl = `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&directionsmode=driving`;

            Linking.canOpenURL(googleUrl).then(supported => {
                if (supported) {
                    Linking.openURL(googleUrl);
                } else {
                    // Fallback to Apple Maps
                    const appleUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}`;
                    Linking.openURL(appleUrl);
                }
            }).catch(err => {
                console.error('An error occurred', err);
                // Fallback to browser
                const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                Linking.openURL(browserUrl);
            });
        } else {
            // Android handling stays the same
            const url = `google.navigation:q=${latitude},${longitude}`;
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                    Linking.openURL(browserUrl);
                }
            }).catch(err => console.error('An error occurred', err));
        }
    };

    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);

    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(offsetY);
    };

    const handleScrollToTop = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                y: 0,
                animated: true
            });
        }
    };

    const opacity = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const opacityreview = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [1, 1],
        extrapolate: 'clamp'
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50, 100],
        outputRange: [1, 1, 1],
        extrapolate: 'clamp',
    });

    const handleReviewSubmit = (reviewData) => {
        // In a real app, you would send this to your API
        console.log('123456')
        setShowWriteReviewModal(false);
        // Switch to reviews tab to see the new review
        setActiveTab('reviews');
        loadInitialData();
    };

    // ฟังก์ชันสำหรับจัดการรูปภาพรีวิว
    const handleReviewImagePress = (images, index) => {
        setReviewImages(images);
        setSelectedReviewImageIndex(index);
        setReviewImageModalVisible(true);
    };

    const renderImageItem = ({ item, index }) => {
        return (
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => {
                    setSelectedImageIndex(index);
                    setModalVisible(true);
                }}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: `${BASEAPI_CONFIG.UrlImg}${item}` }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading && (
                    <View style={styles.imageLoading}>
                        <ActivityIndicator size="large" color="#4B74B3" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Full screen image modal component
    const FullScreenImageModal = () => {
        const [fullImageLoading, setFullImageLoading] = useState(true);

        // รีเซ็ตสถานะการโหลดเมื่อ selectedImageIndex เปลี่ยน
        useEffect(() => {
            setFullImageLoading(true);
        }, [selectedImageIndex]);

        if (!restaurantsData || !restaurantsData.images) return null;

        return (
            <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => {
                    setModalVisible(false);
                    setImagesPreloaded(false); // รีเซ็ตสถานะ preloaded เมื่อปิด
                }}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setModalVisible(false);
                            setImagesPreloaded(false); // รีเซ็ตสถานะ preloaded เมื่อปิด
                        }}
                    >
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {
                                restaurantsData.images[selectedImageIndex] && (
                                    <Image
                                        source={{ uri: `${BASEAPI_CONFIG.UrlImg}${restaurantsData.images[selectedImageIndex]}` }}
                                        style={styles.fullScreenImage}
                                        resizeMode="contain"
                                        onLoadEnd={() => setFullImageLoading(false)}
                                    />
                                )
                            }
                            {fullImageLoading && (
                                <View style={styles.fullScreenImageLoading}>
                                    <ActivityIndicator size="large" color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* ปุ่มนำทาง */}
                    {restaurantsData.images.length > 1 && (
                        <>
                            {selectedImageIndex > 0 && (
                                <TouchableOpacity
                                    style={[styles.navigationButton, styles.prevButton]}
                                    onPress={() => setSelectedImageIndex(prev => prev - 1)}
                                >
                                    <Ionicons name="chevron-back" size={30} color="#FFF" />
                                </TouchableOpacity>
                            )}
                            {selectedImageIndex < restaurantsData.images.length - 1 && (
                                <TouchableOpacity
                                    style={[styles.navigationButton, styles.nextButton]}
                                    onPress={() => setSelectedImageIndex(prev => prev + 1)}
                                >
                                    <Ionicons name="chevron-forward" size={30} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {/* ตัวนับรูปภาพ */}
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {selectedImageIndex + 1} / {restaurantsData.images.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    // Modal สำหรับรูปภาพรีวิว+--+-
   const ReviewImageModal = () => {
        const [fullImageLoading, setFullImageLoading] = useState(true);

        useEffect(() => {
            setFullImageLoading(true);
        }, [selectedReviewImageIndex]);

        return (
            <Modal
                visible={reviewImageModalVisible}
                transparent={true}
                onRequestClose={() => setReviewImageModalVisible(false)}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setReviewImageModalVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {reviewImages.length > 0 && reviewImages[selectedReviewImageIndex] && (
                                <Image
                                    source={{ uri: `${reviewImages[selectedReviewImageIndex]}` }}
                                    style={styles.fullScreenImage}
                                    resizeMode="contain"
                                    onLoadEnd={() => setFullImageLoading(false)}
                                />
                            )}
                            {fullImageLoading && (
                                <View style={styles.fullScreenImageLoading}>
                                    <ActivityIndicator size="large" color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* ปุ่มนำทางสำหรับรูปภาพรีวิว */}
                    {reviewImages.length > 1 && (
                        <>
                            {selectedReviewImageIndex > 0 && (
                                <TouchableOpacity
                                    style={[styles.navigationButton, styles.prevButton]}
                                    onPress={() => setSelectedReviewImageIndex(prev => prev - 1)}
                                >
                                    <Ionicons name="chevron-back" size={30} color="#FFF" />
                                </TouchableOpacity>
                            )}
                            {selectedReviewImageIndex < reviewImages.length - 1 && (
                                <TouchableOpacity
                                    style={[styles.navigationButton, styles.nextButton]}
                                    onPress={() => setSelectedReviewImageIndex(prev => prev + 1)}
                                >
                                    <Ionicons name="chevron-forward" size={30} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {/* ตัวนับรูปภาพสำหรับรูปภาพรีวิว */}
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {selectedReviewImageIndex + 1} / {reviewImages.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveImageIndex(viewableItems[0].index);
        }
    }).current;

    const renderPagination = () => {
        if (!restaurantsData || !restaurantsData.images || restaurantsData.images.length <= 1) {
            return null;
        }

        return (
            <View style={styles.paginationContainer}>
                {restaurantsData.images.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === activeImageIndex && styles.paginationDotActive
                        ]}
                    />
                ))}
            </View>
        );
    };

    const EnvironmentalDataDisplay = React.memo(({ data }) => {
        if (!data) return null;

        return (
            <View style={styles.weatherOverlay}>
                <View style={styles.weatherContainer}>
                    {data.temperature !== null && (
                        <View style={styles.weatherItem}>
                            <Ionicons name="thermometer-outline" size={16} color="#FFF" />
                            <Text style={styles.weatherValue}>
                                {Math.floor(data.temperature)}°C
                            </Text>
                        </View>
                    )}
                    {data.humidity !== null && (
                        <View style={styles.weatherItem}>
                            <Ionicons name="water-outline" size={16} color="#FFF" />
                            <Text style={styles.weatherValue}>
                                {Math.floor(data.humidity)}%
                            </Text>
                        </View>
                    )}
                    {data.co2 !== null && (
                        <>
                            <View style={styles.weatherItem}>
                                <Text style={styles.Co2}>CO₂</Text>
                                <Text style={styles.weatherValue}>
                                    {Math.floor(data.co2)}
                                </Text>
                            </View>
                        </>
                    )}

                    {data.tvoc !== null && (
                        <>
                            <View style={styles.weatherItem}>
                                <Text style={styles.ppm}>tvoc</Text>
                                <Text style={styles.weatherValue}>
                                    {(data.tvoc)}
                                </Text>
                            </View>
                        </>
                    )}

                    {data.hcho !== null && (
                        <>
                            <View style={styles.weatherItem}>
                                <Text style={styles.ppm}>hcho</Text>
                                <Text style={styles.weatherValue}>
                                    {(data.hcho)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>
        );
    });

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#4B74B3" />
                <Text style={{ marginTop: 10 }}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!restaurantsData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>ไม่พบข้อมูลร้านอาหาร</Text>
                <TouchableOpacity
                    style={{ margin: 20, padding: 20, backgroundColor: '#4B74B3', borderRadius: 5 }}
                    onPress={() => router.back()}>
                    <Text style={{ color: 'white' }}>{t('store.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <SafeAreaView style={styles.safeArea}>

                <Header />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        // ตรวจสอบว่าสามารถกลับได้และไม่ใช่หน้า auth
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            // ถ้าไม่มีที่กลับ ให้ไปหน้าหลัก
                            router.replace('/(tabs)/home');
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                    <Text style={styles.backText}>{t('store.back')}</Text>
                </TouchableOpacity>

                <ScrollView
                    ref={scrollViewRef}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="normal"
                >
                    <View style={styles.galleryWrapper}>
                        <FlatList
                            ref={flatListRef}
                            data={restaurantsData.images || [restaurantsData.images[0]]}
                            renderItem={renderImageItem}
                            keyExtractor={(item, index) => `image-${index}`}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={handleViewableItemsChanged}
                            viewabilityConfig={{
                                itemVisiblePercentThreshold: 50
                            }}
                        />

                        {renderPagination()}

                        {restaurantsData.environmentalMetrics.pm25 !== undefined && (
                            <View style={[
                                styles.airQualityBadge,
                                restaurantsData.environmentalMetrics.pm25 <= 15 ? styles.goodAirQuality :
                                    restaurantsData.environmentalMetrics.pm25 <= 30 ? styles.moderateAirQuality :
                                        restaurantsData.environmentalMetrics.pm25 <= 37.5 ? styles.badAirQuality :
                                            restaurantsData.environmentalMetrics.pm25 <= 75 ? styles.verybadAirQuality :
                                                styles.dangerAirQuality
                            ]}>
                                <Text style={[
                                    styles.airQualityValue,
                                    restaurantsData.environmentalMetrics.pm25 <= 15 ? styles.goodAirQuality :
                                        restaurantsData.environmentalMetrics.pm25 <= 30 ? styles.moderateAirQuality :
                                            restaurantsData.environmentalMetrics.pm25 <= 37.5 ? styles.badAirQuality :
                                                restaurantsData.environmentalMetrics.pm25 <= 75 ? styles.verybadAirQuality :
                                                    styles.dangerAirQuality
                                ]}>{Math.floor(restaurantsData.environmentalMetrics.pm25)}</Text>
                                <Text style={styles.airQualityUnit}>µg/m³</Text>
                            </View>
                        )}
                        <EnvironmentalDataDisplay data={environmentalData} />
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>{restaurantsData.name}</Text>
                            <TouchableOpacity
                                onPress={handleFavoritePress}
                                disabled={favoriteLoading}
                                style={styles.favoriteButton}
                            >
                                {favoriteLoading ? (
                                    <ActivityIndicator size="small" color="#FF5252" />
                                ) : (
                                    <Ionicons
                                        name={isFavorite ? "heart" : "heart-outline"}
                                        size={24}
                                        color={isFavorite ? "#FF5252" : "#666"}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Use our new OpeningHours component */}
                        <OpeningHours openingHours={restaurantsData.openingHours} />

                        <View style={styles.ratingSection}>
                            <View style={styles.ratingContainer}>
                                <View style={styles.starRating}>
                                    <StarRating rating={restaurantsData.reviewSummary.average_rating || 0} size={16} />
                                </View>
                                <Text style={styles.ratingText}>
                                    {(parseFloat(restaurantsData.reviewSummary.average_rating) || 0).toFixed(1)}
                                </Text>
                                <TouchableOpacity onPress={() => setActiveTab('reviews')}>
                                    <Text style={styles.reviewCount}>
                                        {restaurantsData.reviewSummary?.review_count || 0} {t('store.review')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.airQualitySection}>
                            <Text style={styles.airQualitySectionTitle}>{t('airQuality.Airqualitymanagement')}</Text>

                            <View style={styles.airQualityItem}>
                                <Ionicons
                                    name={restaurantsData.has_air_purifier ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={restaurantsData.has_air_purifier ? "#4CAF50" : "#F44336"}
                                />
                                <Text style={styles.airQualityText}>
                                    {restaurantsData.has_air_purifier
                                        ? t('store.This_place_has_an_air_purifier')
                                        : t('store.This_place_does_not_have_a_positive_pressure_ventilation_system')}
                                </Text>
                            </View>

                            <View style={styles.airQualityItem}>
                                <Ionicons
                                    name={restaurantsData.has_air_ventilator ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={restaurantsData.has_air_ventilator ? "#4CAF50" : "#F44336"}
                                />
                                <Text style={styles.airQualityText}>
                                    {restaurantsData.has_air_ventilator
                                        ? t('store.This_place_has_an_air_purifier')
                                        : t('store.This_place_does_not_have_a_positive_pressure_ventilation_system')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('store.store_details')}</Text>
                        </View>

                        {/* Info Content */}
                        <Text style={styles.description}>
                            {restaurantsData.description ||
                                'เป็นที่ตั้งร้านอาหารและคาเฟ่ในเชียงใหม่ที่ผสมผสานกับธรรมชาติได้อย่างลงตัว บรรยากาศร่มรื่น ตกแต่งด้วยต้นไม้ใหญ่ได้ Tropical Thai Moss Garden ตั้งอยู่ติดกับภูเขาจำลองระบบนิเวศน์ของน้ำตกเล็ก รายล้อมไปด้วยแมกไม้นานาพันธุ์'}
                        </Text>

                        {/* Map Section */}
                        <View style={styles.mapSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t('store.store_map')}</Text>
                                <TouchableOpacity
                                    style={styles.directionsButton}
                                    onPress={openGoogleMapsDirections}
                                >
                                    <Ionicons name="navigate-outline" size={16} color="#FFF" />
                                    <Text style={styles.directionsText}>{t('store.navigate')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.mapContainer}>
                                <MapView
                                    style={styles.map}
                                    initialRegion={mapRegion}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: mapRegion.latitude,
                                            longitude: mapRegion.longitude
                                        }}
                                        title={restaurantsData.name}
                                    />
                                </MapView>
                            </View>

                            <View style={styles.addressContainer}>
                                <Ionicons name="location-outline" size={20} color="#666" />
                                <Text style={styles.addressText}>
                                    {restaurantsData.name} {restaurantsData.address || 'ตำบลชัยพฤกษ์ อำเภอเมือง จังหวัดเชียงใหม่ 50000'}
                                </Text>
                            </View>

                            <View style={styles.addressContainer}>
                                <Ionicons name="call-outline" size={20} color="#666" />
                                {restaurantsData.phone_number ? (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${restaurantsData.phone_number}`)}
                                    >
                                        <Text style={[styles.addressText, { color: '#4B74B3', textDecorationLine: 'underline' }]}>
                                            {restaurantsData.phone_number}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.addressText}>{t('store.noDetailPhone')}</Text>
                                )}
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="pricetag-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}> {restaurantsData.price_range} </Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="restaurant-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>{restaurantsData.types.map(c => c.name)}</Text>
                            </View>
                            <View style={styles.cuisinesContainer}>
                                <Ionicons name="cafe-outline" size={20} color="#666" />
                                <Text style={styles.cuisinesText}>
                                    {restaurantsData.cuisines.join(" / ") || 'อาหารไทย, อาหารฟิวชั่น, กาแฟ, เบเกอรี่'}
                                </Text>
                            </View>
                        </View>

                        {/* Reviews Section */}
                        <View style={styles.reviewsContainer}>
                            <ReviewsSection
                                restaurantId={restaurantsData}
                                lastUpdate={lastUpdate}
                                onReviewAdded={async () => {
                                    await loadInitialData();
                                }}
                                onImagePress={handleReviewImagePress}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Floating Action Button for Scroll to Top */}
                <Animated.View
                    style={[
                        styles.fab,
                        {
                            opacity: opacity
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={handleScrollToTop}
                        style={styles.fabButton}
                    >
                        <Ionicons name="arrow-up" size={24} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Full Screen Image Modal */}
                <FullScreenImageModal />

                {/* Review Image Modal */}
                <ReviewImageModal />

                {/* Write Review Modal */}
                <WriteReviewModal
                    visible={showWriteReviewModal}
                    onClose={() => setShowWriteReviewModal(false)}
                    onSubmit={async (reviewData) => {
                        setShowWriteReviewModal(false);
                        setActiveTab('reviews');
                        await loadInitialData(); // <-- สำคัญ! ต้องเรียกตรงนี้
                    }}
                    storeId={restaurantsData.id}
                />
            </SafeAreaView>
        </View>
    );
};


const styles = StyleSheet.create({
    // Container styles
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    safeArea: {
        flex: 1,
        paddingTop: STATUSBAR_HEIGHT || 30,
    },

    // Header styles
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT + STATUSBAR_HEIGHT + TOP_SPACING,
        marginTop: 35,
        zIndex: 1000,
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    // Navigation styles
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 30,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#000000',
    },

    // Gallery styles
    galleryWrapper: {
        height: 230,
        position: 'relative',
        marginHorizontal: 30,
        marginTop: 20,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        width: width - 60,
        height: 230,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    imageLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },

    // Pagination styles
    paginationContainer: {
        position: 'absolute',
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        margin: 4,
    },
    paginationDotActive: {
        backgroundColor: '#ffffff',
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    // Air Quality styles
    airQualityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ffffff',
        borderRadius: 50,
        borderWidth: 3,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    goodAirQuality: {
        borderColor: '#00BFF3',
        color: '#00BFF3',
    },
    moderateAirQuality: {
        borderColor: '#00A651',
        color: '#00A651',
    },
    badAirQuality: {
        borderColor: '#FDC04E',
        color: '#FDC04E',
    },
    verybadAirQuality: {
        borderColor: '#F26522',
        color: '#F26522',
    },
    dangerAirQuality: {
        borderColor: '#CD0000',
        color: '#CD0000',
    },
    airQualityValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    airQualityUnit: {
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: -5,
        color: '#000'
    },

    // Weather overlay styles
    weatherOverlay: {
        position: 'absolute',
        top: 60,
        right: 10,
        width: 80,
    },
    weatherContainer: {
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 8,
        overflow: 'hidden',
        paddingRight: 5,
    },
    weatherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    weatherValue: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    ppm: {
        paddingRight: 5,
        color: '#ffffff',
    },
    Co2: {
        paddingLeft: 5,
        color: '#ffffff',
        fontSize: 12,
    },

    // Details container styles
    detailsContainer: {
        padding: 16,
    },
    titleSection: {
        marginBottom: 12,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333333',
        flex: 1,
    },
    favoriteButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    openStatus: {
        color: '#4CAF50',
        fontSize: 14,
    },

    // Rating styles
    ratingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starRating: {
        marginRight: 5,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
        color: '#333333',
    },
    reviewCount: {
        color: '#666666',
        textDecorationLine: 'underline',
    },

    // Air Quality Section styles
    airQualitySection: {
        marginTop: 15,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
    },
    airQualitySectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333333',
    },
    airQualityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    airQualityText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#444444',
    },

    // Section styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
        marginBottom: 20,
    },

    // Map styles
    mapSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eeeeee',
        paddingTop: 20,
    },
    directionsButton: {
        flexDirection: 'row',
        backgroundColor: '#4B74B3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    directionsText: {
        color: '#ffffff',
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 15,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },

    // Address and info styles
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    addressText: {
        fontSize: 14,
        color: '#333333',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoText: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 8,
    },
    cuisinesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    cuisinesText: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 8,
        flex: 1,
    },

    // Reviews container
    reviewsContainer: {
        marginTop: 20,
    },

    // Floating Action Button styles
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 30,
        backgroundColor: '#2196F3',
        borderRadius: 30,
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: width,
        height: height * 0.8,
    },
    fullScreenImageLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 5,
    },
    navigationButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 10,
        zIndex: 2,
    },
    prevButton: {
        left: 20,
    },
    nextButton: {
        right: 20,
    },
    imageCounter: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
    },
    imageCounterText: {
        color: '#ffffff',
        fontSize: 14,
    },
});

export default ShopDetails;