import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchRestaurantByTypeId } from '@/api/baseapi';
import { BASEAPI_CONFIG } from '@/config';
import { useLocation } from '@/utils/LocationContext';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

// ประกาศ interface สำหรับข้อมูลร้านค้า
interface Place {
    environmentalMetrics?: {
        pm25?: number;
    };
    cuisines?: string[];
    reviewSummary?: {
        average_rating?: number;
    };
    id: number;
    name: string;
    rating?: number;
    reviews?: string;
    distance?: string;
    airQuality?: number | string;
    image?: any;
    latitude?: number;
    longitude?: number;
    images?: string[];
    distance_km?: string;
}

const { width } = Dimensions.get('window');

export default function ServiceListingScreen() {
    const router = useRouter();
    const { id, label, icon } = useLocalSearchParams();
    const { location, address } = useLocation();
    const mapRef = useRef<MapView>(null);
    const { t } = useTranslation();
    // สร้าง state สำหรับเก็บข้อมูลร้านค้าและสถานะการโหลด
    const [places, setPlaces] = useState<Place[]>([]);
    const [allPlaces, setAllPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // เพิ่ม state สำหรับ error
    const [activeFilter, setActiveFilter] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: location?.latitude ? Number(location.latitude) : 13.736717,
        longitude: location?.longitude ? Number(location.longitude) : 100.523186,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [showMapFullscreen, setShowMapFullscreen] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

    // ฟังก์ชันสำหรับดึงข้อมูลจาก API
    const fetchPlaces = async (filter = 0) => {
        try {
            setLoading(true);
            setError(null);

            // ตรวจสอบว่า id มีค่าหรือไม่
            if (!id) {
                throw new Error('ไม่พบ ID ของประเภทร้านค้า');
            }

            // ใช้ตำแหน่งเริ่มต้นถ้าไม่มี location
            let latitude = 13.736717; // กรุงเทพฯ
            let longitude = 100.523186;

            if (location && location.latitude && location.longitude) {
                latitude = Number(location.latitude);
                longitude = Number(location.longitude);
            }

            console.log('Fetching with:', { id, latitude, longitude, filter });

            // ทำการเรียก API
            const response = await fetchRestaurantByTypeId(id, latitude, longitude, filter);
            console.log('rester', response);
            // ตรวจสอบ response
            if (!response) {
                throw new Error('ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์');
            }

            let placesData = [];

            // ตรวจสอบโครงสร้างของ response
            if (Array.isArray(response)) {
                placesData = response;
            } else if (response.data && Array.isArray(response.data)) {
                placesData = response.data;
            } else if (response.restaurants && Array.isArray(response.restaurants)) {
                placesData = response.restaurants;
            } else {
                console.warn('Unknown response structure:', response);
                placesData = [];
            }

            // เพิ่มพิกัดให้กับข้อมูล
            const placesWithCoordinates = placesData.map((place: any, index: number) => {
                // แปลงข้อมูลให้ตรงกับ interface Place
                const normalizedPlace: Place = {
                    id: place.id || index + 1,
                    name: place.name || 'ไม่ทราบชื่อ',
                    rating: place.rating || place.reviewSummary?.average_rating || 0,
                    reviews: place.reviews || '0 รีวิว',
                    distance: place.distance || place.distance_km || '0 กม.',
                    airQuality: place.airQuality || place.environmentalMetrics?.pm25 || '...',
                    image: place.image || null,
                    images: place.images || [],
                    cuisines: place.cuisines || [],
                    reviewSummary: place.reviewSummary || { average_rating: 0 },
                    distance_km: place.distance_km || '0',
                    environmentalMetrics: place.environmentalMetrics
                };

                // ตรวจสอบและกำหนดพิกัด
                if (!place.latitude || !place.longitude || isNaN(Number(place.latitude)) || isNaN(Number(place.longitude))) {
                    const randomOffset = () => (Math.random() - 0.5) * 0.01;
                    return {
                        ...normalizedPlace,
                        latitude: latitude + randomOffset(),
                        longitude: longitude + randomOffset()
                    };
                }

                return {
                    ...normalizedPlace,
                    latitude: Number(place.latitude),
                    longitude: Number(place.longitude)
                };
            });

            setAllPlaces(placesWithCoordinates);
            setPlaces(placesWithCoordinates);

            if (placesWithCoordinates.length > 0) {
                fitMapToMarkers(placesWithCoordinates);
            }

        } catch (error: any) {
            //console.error('Error fetching places:', error);
            setError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');

            // แสดง Alert เมื่อเกิดข้อผิดพลาด
            Alert.alert(
                'เกิดข้อผิดพลาด',
                error.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                [
                    {
                        text: 'ลองใหม่',
                        onPress: () => fetchPlaces(filter)
                    },
                    {
                        text: 'ยกเลิก',
                        style: 'cancel'
                    }
                ]
            );

        } finally {
            setLoading(false);
        }
    };


    // ฟังก์ชันสำหรับการปรับขอบเขตแผนที่ให้แสดงทุกร้านค้า
    const fitMapToMarkers = (placesData: Place[]) => {
        if (mapRef.current && placesData.length > 0) {
            const validPlaces = placesData.filter(
                place => place.latitude && place.longitude &&
                    !isNaN(Number(place.latitude)) && !isNaN(Number(place.longitude))
            );

            if (validPlaces.length === 0) return;

            const coordinates = validPlaces.map(place => ({
                latitude: Number(place.latitude),
                longitude: Number(place.longitude)
            }));

            let minLat = coordinates[0].latitude;
            let maxLat = coordinates[0].latitude;
            let minLon = coordinates[0].longitude;
            let maxLon = coordinates[0].longitude;

            coordinates.forEach(coord => {
                minLat = Math.min(minLat, coord.latitude);
                maxLat = Math.max(maxLat, coord.latitude);
                minLon = Math.min(minLon, coord.longitude);
                maxLon = Math.max(maxLon, coord.longitude);
            });

            const LATITUDE_DELTA = (maxLat - minLat) * 1.5 || 0.01;
            const LONGITUDE_DELTA = (maxLon - minLon) * 1.5 || 0.01;

            setTimeout(() => {
                mapRef.current?.animateToRegion({
                    latitude: (minLat + maxLat) / 2,
                    longitude: (minLon + maxLon) / 2,
                    latitudeDelta: Math.max(0.01, LATITUDE_DELTA),
                    longitudeDelta: Math.max(0.01, LONGITUDE_DELTA)
                }, 500);
            }, 500);
        }
    };

    // ฟังก์ชันสำหรับการกดตัวกรอง
    const handleFilterPress = (filter: number) => {
        setActiveFilter(filter);
        fetchPlaces(filter);
    };

    // ฟังก์ชันสำหรับค้นหาร้านจากชื่อ
    const handleSearch = (text: string) => {
        setSearchText(text);

        if (!text.trim()) {
            setPlaces(allPlaces);
            return;
        }

        const filteredPlaces = allPlaces.filter(place =>
            place.name.toLowerCase().includes(text.toLowerCase())
        );

        setPlaces(filteredPlaces);

        if (filteredPlaces.length > 0) {
            fitMapToMarkers(filteredPlaces);
        }
    };

    const onPlacePress = (ids: number | string) => {
        router.push({
            pathname: `/places/details`,
            params: { id: ids }
        });
    };

    // ฟังก์ชันสำหรับการกดที่มาร์กเกอร์บนแผนที่
    const handleMarkerPress = (placeId: number) => {
        setSelectedMarker(placeId);

        const selectedPlace = places.find(place => place.id === placeId);
        if (selectedPlace && selectedPlace.latitude && selectedPlace.longitude &&
            !isNaN(Number(selectedPlace.latitude)) && !isNaN(Number(selectedPlace.longitude))) {
            mapRef.current?.animateToRegion({
                latitude: Number(selectedPlace.latitude),
                longitude: Number(selectedPlace.longitude),
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            }, 500);
        }
    };

    // ฟังก์ชันสำหรับการสลับระหว่างโหมดแผนที่เต็มหน้าจอ
    const toggleMapFullscreen = () => {
        setShowMapFullscreen(!showMapFullscreen);
    };

    // เรียกใช้ fetchPlaces เมื่อคอมโพเนนต์ถูกโหลด
    useEffect(() => {
        if (id) {
            fetchPlaces();
        } else {
            setError('ไม่พบ ID ของประเภทร้านค้า');
            setLoading(false);
        }
    }, [id]);

    // ... ส่วนที่เหลือของ component UI ยังคงเหมือนเดิม
    return (
        <View style={styles.container}>
        <SafeAreaView >
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />
            {/* ส่วนหัวของหน้า */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                    <Text style={styles.backText}>{t('store.back')}</Text>
                </TouchableOpacity>

                {showSearch ? (
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('store.searchStorePlaceholder')} // เพิ่ม key ในไฟล์ภาษา เช่น "ค้นหาชื่อร้าน..."
                            placeholderTextColor="#999"
                            value={searchText}
                            onChangeText={handleSearch}
                            autoFocus
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setShowSearch(false);
                                setSearchText('');
                                handleSearch('');
                            }}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.titleContainer}>
                            <MaterialCommunityIcons
                                name={(icon as any) || 'store'}
                                size={24}
                                color="#4A6FA5"
                            />
                            <Text style={styles.headerTitle}>{label || t('store.services')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={() => setShowSearch(true)}
                        >
                            <Ionicons name="search" size={24} color="#000" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* ส่วนแผนที่ */}
            <View style={[styles.mapContainer, showMapFullscreen && styles.mapFullscreen]}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    region={mapRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {places.map((place) => {
                        if (place.latitude && place.longitude &&
                            !isNaN(place.latitude) && !isNaN(place.longitude)) {
                            return (
                                <Marker
                                    key={`marker-${place.id}`}
                                    identifier={`marker-${place.id}`}
                                    coordinate={{
                                        latitude: Number(place.latitude),
                                        longitude: Number(place.longitude)
                                    }}
                                    title={place.name}
                                    description={`คะแนน: ${parseFloat((place.reviewSummary?.average_rating || 0).toString()).toFixed(2)}, ระยะทาง: ${place.distance_km || '0'} กม.`}
                                    onPress={() => handleMarkerPress(place.id)}
                                >
                                    {(() => {
                                        const pm25Value = place.environmentalMetrics?.pm25 || place.airQuality || '...';
                                        return (
                                            <View style={[
                                                styles.markerContainer,
                                                pm25Value === '...' ? styles.DisAirQuality :
                                                    Number(pm25Value) <= 15 ? styles.goodAirQuality :
                                                        Number(pm25Value) <= 30 ? styles.moderateAirQuality :
                                                            Number(pm25Value) <= 37.5 ? styles.badAirQuality :
                                                                Number(pm25Value) <= 75 ? styles.verybadAirQuality :
                                                                    styles.dangerAirQuality,
                                                selectedMarker === place.id && styles.selectedMarker
                                            ]}>
                                                <View style={styles.markerInner}>
                                                    <Text style={pm25Value === '...' ? styles.DisAirQuality :
                                                        Number(pm25Value) <= 15 ? styles.goodAirQuality :
                                                            Number(pm25Value) <= 30 ? styles.moderateAirQuality :
                                                                Number(pm25Value) <= 37.5 ? styles.badAirQuality :
                                                                    Number(pm25Value) <= 75 ? styles.verybadAirQuality :
                                                                        styles.dangerAirQuality}>
                                                        {typeof pm25Value === 'number' ? Math.floor(pm25Value) : pm25Value}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })()}
                                </Marker>
                            );
                        }
                        return null;
                    })}
                </MapView>
                <TouchableOpacity style={styles.mapToggleButton} onPress={toggleMapFullscreen}>
                    <Ionicons name={showMapFullscreen ? "contract" : "expand"} size={24} color="#4A6FA5" />
                </TouchableOpacity>
            </View>

            {/* แสดงตัวกรอง */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                >
                    <TouchableOpacity
                        style={[styles.filterItem, activeFilter === 0 && styles.activeFilter]}
                        onPress={() => handleFilterPress(0)}
                    >
                        <Text style={[styles.filterText, activeFilter === 0 && styles.activeFilterText]}>
                            {t('store.all')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, activeFilter === 1 && styles.activeFilter]}
                        onPress={() => handleFilterPress(1)}
                    >
                        <Text style={[styles.filterText, activeFilter === 1 && styles.activeFilterText]}>
                            {t('store.nearby')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, activeFilter === 2 && styles.activeFilter]}
                        onPress={() => handleFilterPress(2)}
                    >
                        <Text style={[styles.filterText, activeFilter === 2 && styles.activeFilterText]}>
                            {t('store.highest_rating')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, activeFilter === 3 && styles.activeFilter]}
                        onPress={() => handleFilterPress(3)}
                    >
                        <Text style={[styles.filterText, activeFilter === 3 && styles.activeFilterText]}>
                            {t('store.Best_Air')}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* รายการสถานที่ */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#4A6FA5" />
                        <Text style={styles.loaderText}>{t('common.loading')}</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning-outline" size={60} color="#f44336" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchPlaces(activeFilter)}
                        >
                            <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : places.length === 0 ? (
                    <View style={styles.noResultContainer}>
                        <Ionicons name="search-outline" size={60} color="#ccc" />
                        <Text style={styles.noResultText}>{t('store.noResult')}</Text>
                        <Text style={styles.noResultSubText}>{t('store.noResultSub')}</Text>
                    </View>
                ) : (
                    <View style={styles.placesGrid}>
                        {places.map((place) => (
                            <TouchableOpacity
                                key={`place-${place.id}`}
                                style={[
                                    styles.placeCard,
                                    selectedMarker === place.id && styles.selectedPlaceCard
                                ]}
                                onPress={() => onPlacePress(place.id)}
                            >
                                <View style={styles.imageContainer}>
                                    {place.images && Array.isArray(place.images) && place.images.length > 0 ? (
                                        <Image
                                            source={{ uri: `${BASEAPI_CONFIG.UrlImg || ''}${place.images[0]}` }}
                                            style={styles.placeImage}
                                            defaultSource={require('@/assets/images/logo.png')}
                                            onError={(e) => { }}
                                        />
                                    ) : (
                                        <Image
                                            source={require('@/assets/images/logo.png')}
                                            style={styles.placeImage}
                                        />
                                    )}
                                    {(() => {
                                        console.log(place.environmentalMetrics?.pm25)
                                        if (place.environmentalMetrics?.pm25 !== undefined) {
                                            if (place.environmentalMetrics && place.environmentalMetrics.pm25 !== undefined) {
                                                place.environmentalMetrics.pm25 = Number(place.environmentalMetrics.pm25);
                                            }
                                        }
                                        const pm25Value = place.environmentalMetrics?.pm25 || place.airQuality || '...';

                                        return (
                                            <View
                                                key={`air-quality-badge-${place.id}`}
                                                style={[styles.airQualityBadge,
                                                pm25Value === '...' ? styles.DisAirQuality :
                                                    Number(pm25Value) <= 15 ? styles.goodAirQuality :
                                                        Number(pm25Value) <= 30 ? styles.moderateAirQuality :
                                                            Number(pm25Value) <= 37.5 ? styles.badAirQuality :
                                                                Number(pm25Value) <= 75 ? styles.verybadAirQuality :
                                                                    styles.dangerAirQuality]}>
                                                <Text
                                                    key={`air-quality-value-${place.id}`}
                                                    style={[styles.airQualityValue,
                                                    pm25Value === '...' ? styles.DisAirQuality :
                                                        Number(pm25Value) <= 15 ? styles.goodAirQuality :
                                                            Number(pm25Value) <= 30 ? styles.moderateAirQuality :
                                                                Number(pm25Value) <= 37.5 ? styles.badAirQuality :
                                                                    Number(pm25Value) <= 75 ? styles.verybadAirQuality :
                                                                        styles.dangerAirQuality]}>
                                                    {typeof pm25Value === 'number' ? Math.floor(pm25Value) : pm25Value}
                                                </Text>
                                                <Text key={`air-quality-unit-${place.id}`} style={styles.airQualityUnit}>µg/m³</Text>
                                            </View>
                                        );
                                    })()}
                                </View>

                                <View style={styles.placeInfo}>
                                    <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Text style={styles.cuisines} numberOfLines={1}>
                                            {Array.isArray(place.cuisines)
                                                ? place.cuisines.filter(Boolean).join(" / ")
                                                : (typeof place.cuisines === "string" ? place.cuisines : "")}
                                        </Text>
                                    </View>
                                    <View style={styles.placeDetails}>
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={16} color="#FFD700" />
                                            <Text style={styles.rating}>
                                                {place.reviewSummary?.average_rating
                                                    ? parseFloat(place.reviewSummary.average_rating.toString()).toFixed(1)
                                                    : "0.0"}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="location-outline" size={14} color="#666" />
                                            <Text style={styles.distance}>
                                                {place.distance_km
                                                    ? t('store.distanceKm', { distance: place.distance_km })
                                                    : ""}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    // แก้ไข: ลบ marginTop ออกจาก container
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        marginTop: Platform.OS === 'ios' ? 35 : 35,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 8,
        fontSize: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#000'
    },
    searchButton: {
        padding: 8,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        marginLeft: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        paddingVertical: 0,
    },
    // ส่วนของ Map
    mapContainer: {
        height: 200,
        width: '100%',
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    mapFullscreen: {
        height: '70%', // เมื่อขยายแผนที่เต็มหน้าจอ
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapToggleButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 30,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerContainer: {
        width: 30,
        height: 30,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        color: '#000',
        borderColor: 'white',
    },
    markerInner: {
        width: 26,
        height: 26,
        borderRadius: 13,
        fontSize: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedMarker: {
        backgroundColor: '#FF6B6B',
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    filterWrapper: {
        height: 70,
    },
    filterContainer: {
        padding: 16
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeFilter: {
        backgroundColor: '#4A6FA5',
    },
    filterText: {
        color: '#333',
        fontSize: 14,
        alignContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    placesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    placeCard: {
        width: '48%',
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedPlaceCard: {
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    placeImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
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
    DisAirQuality: {
        borderColor: '#d0d0d0',
        color: '#d0d0d0',
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
    goodAirQualityText: {
        color: '#4CAF50',
    },
    moderateAirQualityText: {
        color: '#FFC107',
    },
    badAirQualityText: {
        color: '#F44336',
    },
    airQualityValue: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    airQualityUnit: {
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: -5,
        color: '#000',
    },
    placeInfo: {
        padding: 12,
    },
    placeName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#000',
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000'
    },
    reviews: {
        fontSize: 12,
        color: '#666',
        marginLeft: 2,
    },
    distance: {
        fontSize: 12,
        color: '#666',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loaderText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    placeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    noResultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    noResultText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    noResultSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    cuisines: {
        fontSize: 12,
        color: '#666',
    },
    // เพิ่ม styles สำหรับ error
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#f44336',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4A6FA5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});