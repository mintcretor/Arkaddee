import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  PixelRatio,
  Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fetchNearbyRestaurants } from '@/api/baseapi';
import { BASEAPI_CONFIG } from '@/config';
import { useLocation } from '@/utils/LocationContext';
import { useTranslation } from 'react-i18next';

// รับค่าความกว้างและความสูงของหน้าจอ
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ฟังก์ชันสำหรับปรับขนาด font ตามขนาดหน้าจอ
const scaleFontSize = (size) => {
  const scale = SCREEN_WIDTH / 375; // ใช้ iPhone 8 เป็นมาตรฐาน (375px)
  const newSize = size * scale;

  // ป้องกันไม่ให้ font ใหญ่หรือเล็กเกินไป
  const maxSize = size * 1.5;
  const minSize = size * 0.8;

  if (newSize > maxSize) return maxSize;
  if (newSize < minSize) return minSize;

  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// ฟังก์ชันสำหรับปรับขนาดตามอัตราส่วน
const scaleSize = (size) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// กำหนดขนาด responsive สำหรับองค์ประกอบต่างๆ
const RESPONSIVE_SIZES = {
  // Font sizes
  font: {
    tiny: scaleFontSize(8),    // เพิ่มขนาด tiny สำหรับข้อความเล็กมาก
    small: scaleFontSize(12),
    normal: scaleFontSize(14),
    medium: scaleFontSize(16),
    large: scaleFontSize(18),
    xlarge: scaleFontSize(20),
  },
  // Icon sizes
  icon: {
    small: scaleSize(16),
    normal: scaleSize(20),
    medium: scaleSize(24),
    large: scaleSize(30),
  },
  // Spacing
  spacing: {
    tiny: scaleSize(4),
    small: scaleSize(8),
    normal: scaleSize(12),
    medium: scaleSize(16),
    large: scaleSize(20),
    xlarge: scaleSize(24),
  },
  // แก้ไขส่วนของ iconContainer และ imageSize
  iconContainer: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(12),
  },
  imageSize: {
    placeCard: {
      width: (SCREEN_WIDTH - scaleSize(48)) / 2, // หัก padding ออก
      height: scaleSize(140),
    },
    airQualityBadge: {
      width: scaleSize(36),        // ลดขนาดจาก 40 เป็น 36
      height: scaleSize(36),       // ลดขนาดจาก 40 เป็น 36
      borderRadius: scaleSize(18), // ปรับรัศมีตาม
      borderWidth: scaleSize(2.5), // ปรับขนาดเส้นขอบให้เล็กลง
    },
    partnerLogo: {
      width: scaleSize(30),
      height: scaleSize(30),
    },
    partnerLogoLarge: {
      width: scaleSize(70),
      height: scaleSize(35),
    },
    partnerLogoXLarge: {
      width: scaleSize(80),
      height: scaleSize(35),
    },
  },
};

interface PlaceCard {
  id: number | string;
  image_url?: string;
  image?: string[];
  rating: number;
  reviewCount?: number;
  distance: string;
  price: string;
  priceRange?: string;
  airQuality?: number | string;
  environmentalMetrics?: {
    pm25?: number;
    temperature?: number;
    humidity?: number;
    co2?: number;
    tvoc?: number;
  };
  name?: string;
  averagePricePerPerson?: number;
  location?: {
    district?: string;
    address?: string;
  };
  latitude?: number;
  longitude?: number;
  address?: string;
  cuisines?: string;
  types?: string[];
}

// เพิ่มอินเตอร์เฟซสำหรับข้อมูลตำแหน่ง
interface LocationData {
  latitude: number;
  longitude: number;
}

// เพิ่ม interface สำหรับ props ของ MainContent
interface MainContentProps {
  onPlacePress?: (placeId: number) => void;
  navigation?: any;
}

// ใช้ forwardRef เพื่อรับ ref จาก parent component
const MainContent = forwardRef<any, MainContentProps>((props, ref) => {
  const router = useRouter();
  const { location, loading: locationLoading } = useLocation();
  const { t } = useTranslation();

  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true); // เพิ่ม state สำหรับควบคุมการอัพเดทอัตโนมัติ
  const [showAll, setShowAll] = useState(false);
  const [showAllHot, setShowAllHot] = useState(false);

  // ตำแหน่งเริ่มต้นสำหรับใช้เป็นค่าสำรอง (กรุงเทพฯ)
  const defaultLocation: LocationData = {
    latitude: 13.7563,
    longitude: 100.5018
  };

  const services = [
    { id: 1, icon: 'coffee', label: t('home.coffee'), iconType: 'MaterialCommunity', type: 'cafe' },
    { id: 2, icon: 'silverware-fork-knife', label: t('home.restaurant'), iconType: 'MaterialCommunity', type: 'restaurant' },
    { id: 3, icon: 'book-open-variant', label: t('home.school'), iconType: 'MaterialCommunity', type: 'school' },
    { id: 5, icon: 'bed', label: t('home.hotel'), iconType: 'Ionicons', type: 'hotel' },
    { id: 6, icon: 'school', label: t('home.university'), iconType: 'MaterialCommunity', type: 'university' },
    { id: 7, icon: 'dumbbell', label: t('home.fitness'), iconType: 'MaterialCommunity', type: 'fitness' },
    { id: 4, icon: 'stethoscope', label: t('home.clinic'), iconType: 'MaterialCommunity', type: 'clinic' },
    { id: 8, icon: 'plus', label: t('home.other'), iconType: 'MaterialCommunity', type: 'other' },
  ];

  // ฟังก์ชันสำหรับการแสดงสถานที่แนะนำโดยไม่ต้องรอตำแหน่ง
  const useDefaultLocation = useCallback(() => {
    setUsingDefaultLocation(true);
    setLocationAttempts(5); // ลดจำนวนครั้งลงเพื่อให้ข้ามเร็วขึ้น
    return loadPlacesWithLocation(defaultLocation);
  }, []);

  // ฟังก์ชันรวมสำหรับแปลงข้อมูลสถานที่
  const formatPlaceData = useCallback((item: any, index: number): PlaceCard => {
    let restaurantTypes = [];
    if (item.types && Array.isArray(item.types)) {
      if (item.types.length > 0 && typeof item.types[0] === 'string') {
        restaurantTypes = item.types;
      } else if (item.types.length > 0 && typeof item.types[0] === 'object') {
        restaurantTypes = item.types.map((type: any) => {
          if (type && type.name) {
            return type.name;
          } else if (type && type.type) {
            return type.type;
          }
          return String(type);
        }).filter(Boolean);
      }
    }

    let imageUrl = null;
    if (item.images && item.images.length > 0) {
      const imagePath = item.images[0];
      imageUrl = `${BASEAPI_CONFIG.UrlImg}${imagePath}`;
    }

    let price;
    if (item.price) {
      price = item.price;
    } else if (item.average_price_per_person) {
      price = item.average_price_per_person.toString();
    } else if (item.priceRange) {
      price = item.priceRange;
    } else {
      price = '0';
    }

    let airQuality;
    if (item.air_quality) {
      airQuality = item.air_quality;
    } else if (item.airQuality) {
      airQuality = item.airQuality;
    } else if (item.environmentalMetrics && item.environmentalMetrics.pm25) {
      airQuality = Math.floor(item.environmentalMetrics.pm25);
    } else {
      airQuality = '...';
    }

    let distance = item.distance_km;
    if (!distance && item.location) {
      distance = item.location.district || item.location.address || '0';
    } else if (!distance) {
      distance = '0';
    }

    distance = parseFloat(distance).toFixed(1) + '';

    return {
      id: item.id || item._id || index + 1,
      image_url: imageUrl,
      rating: item.reviewSummary?.average_rating || 0,
      reviewCount: item.reviewSummary?.review_count || 0,
      distance: distance,
      price: price,
      airQuality: airQuality,
      name: item.name || '',
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address,
      location: item.location,
      cuisines: item.cuisines?.join(" / ") || "",
      types: restaurantTypes,
      environmentalMetrics: item.environmentalMetrics
    };
  }, []);

  // ฟังก์ชันเดียวเพื่อโหลดข้อมูล
  const loadPlacesWithLocation = useCallback(async (loc: LocationData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { latitude, longitude } = loc;
      const radius = 5000;

      //console.log(`กำลังโหลดข้อมูลจากพิกัด: ${latitude}, ${longitude}`);
      const response = await fetchNearbyRestaurants(latitude, longitude, radius);

      let restaurantsData = [];

      if (response?.data?.restaurants) {
        restaurantsData = response.data.restaurants;
      } else if (response?.restaurants) {
        restaurantsData = response.restaurants;
      } else if (Array.isArray(response)) {
        restaurantsData = response;
      }

      if (!Array.isArray(restaurantsData)) {
        throw new Error('ไม่พบข้อมูลร้านอาหารในรูปแบบที่ถูกต้อง');
      }

      // เก็บข้อมูลดิบจาก API
      setApiData(restaurantsData);

      // แปลงข้อมูลเป็นรูปแบบที่ต้องการ (เฉพาะส่วนที่จะแสดงทันที)
      const formattedPlaces = restaurantsData
        .slice(0, 10) // จำกัดจำนวนข้อมูลเพื่อประสิทธิภาพในการโหลดครั้งแรก
        .map(formatPlaceData);

      setPlaces(formattedPlaces);
      setError(null);
    } catch (err: any) {
      console.error('Error loading places:', err);
      setError('ไม่สามารถโหลดข้อมูลสถานที่อากาศดีได้: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }

    // คืนค่า Promise เพื่อให้สามารถใช้ .then() ได้
    return Promise.resolve();
  }, [formatPlaceData]);

  useFocusEffect(
    useCallback(() => {
      let intervalId;

      if (autoRefresh) {
        // สร้าง interval สำหรับอัพเดทข้อมูลทุกๆ 1 นาที
        intervalId = setInterval(() => {
          // เรียกฟังก์ชันโหลดข้อมูลใหม่
          if (location) {
            loadPlacesWithLocation(location);
            //console.log('กำลังอัพเดทข้อมูลอัตโนมัติ...');
          } else if (usingDefaultLocation) {
            loadPlacesWithLocation(defaultLocation);
            //  console.log('กำลังอัพเดทข้อมูลอัตโนมัติด้วยตำแหน่งเริ่มต้น...');
          }
        }, 60000); // 60000 มิลลิวินาที = 1 นาที
      }

      // เคลียร์ interval เมื่อ component unmount หรือเมื่อ dependency เปลี่ยน
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [location, usingDefaultLocation, autoRefresh, loadPlacesWithLocation])
  );
  // เพิ่ม useEffect สำหรับตั้งเวลาการอัพเดททุกๆ 1 นาที (60000 มิลลิวินาที)
  useEffect(() => {
    let intervalId;

    if (autoRefresh) {
      // สร้าง interval สำหรับอัพเดทข้อมูลทุกๆ 1 นาที
      intervalId = setInterval(() => {
        // เรียกฟังก์ชันโหลดข้อมูลใหม่
        if (location) {
          loadPlacesWithLocation(location);
          //console.log('กำลังอัพเดทข้อมูลอัตโนมัติ...');
        } else if (usingDefaultLocation) {
          loadPlacesWithLocation(defaultLocation);
          //  console.log('กำลังอัพเดทข้อมูลอัตโนมัติด้วยตำแหน่งเริ่มต้น...');
        }
      }, 60000); // 60000 มิลลิวินาที = 1 นาที
    }

    // เคลียร์ interval เมื่อ component unmount หรือเมื่อ dependency เปลี่ยน
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [location, usingDefaultLocation, autoRefresh, loadPlacesWithLocation]);

  // ใช้ useMemo เพื่อสร้าง placesHot จากข้อมูลเดียวกันเพื่อไม่ต้องเรียก API ซ้ำ
  const placesHot = useMemo(() => {
    // จัดเรียงข้อมูลตามช่วง PM2.5 แบบขั้นบันได และเรียงตาม average_rating ในแต่ละช่วง
    return apiData
      .slice(0, 10)
      .sort((a, b) => {
        // ฟังก์ชันสำหรับจัดกลุ่ม PM2.5 เป็นช่วง
        const getPM25Tier = (place) => {
          const pm25 = place.environmentalMetrics?.pm25;

          // ถ้าไม่มีค่า PM2.5 ให้อยู่ท้ายสุด
          if (pm25 === undefined || pm25 === null) {
            return 4;
          }

          // แบ่งตามช่วงที่กำหนด
          if (pm25 >= 0 && pm25 <= 30) {
            return 0;
          } else if (pm25 > 30 && pm25 <= 37.5) {
            return 1;
          } else if (pm25 > 37.5 && pm25 <= 75) {
            return 2;
          } else {
            return 3; // 75 ขึ้นไป
          }
        };

        // เรียงตามช่วง PM2.5 ก่อน
        const tierA = getPM25Tier(a);
        const tierB = getPM25Tier(b);

        if (tierA !== tierB) {
          return tierA - tierB; // เรียงจากช่วงน้อยไปมาก
        }

        // ถ้าอยู่ในช่วง PM2.5 เดียวกัน ให้เรียงตามเรตติ้งจากมากไปน้อย
        const ratingA = a.reviewSummary?.average_rating || 0;
        const ratingB = b.reviewSummary?.average_rating || 0;
        return ratingB - ratingA;
      })
      .map(formatPlaceData);
  }, [apiData, formatPlaceData]);

  // อัปเดตการทำงานเมื่อ location เปลี่ยนแปลง
  useEffect(() => {
    if (location) {
      // ถ้ามีตำแหน่งแล้ว ให้โหลดข้อมูลด้วยตำแหน่งจริง
      loadPlacesWithLocation(location);
    } else {
      // ปรับปรุงกลไกการลองใหม่สำหรับตำแหน่ง
      const maxAttempts = 5; // ลดจาก 10 เป็น 5
      const retryInterval = 1000; // ลดจาก 1500ms เป็น 1000ms

      if (locationAttempts < maxAttempts && !usingDefaultLocation) {
        setIsLoading(true);

        // แสดงข้อความโหลดที่ให้ข้อมูลมากขึ้น
        if (locationAttempts > 1) {
          setError('กำลังรอตำแหน่งของคุณ... โปรดรอสักครู่');
        }

        const timer = setTimeout(() => {
          setLocationAttempts(prev => prev + 1);
        }, retryInterval);

        return () => clearTimeout(timer);
      } else if (!usingDefaultLocation) {
        // ถ้าลองหลายครั้งแล้วยังไม่ได้ จะใช้ตำแหน่งเริ่มต้น
        setError('ไม่สามารถรับตำแหน่งของคุณได้ กำลังแสดงผลสถานที่แนะนำแทน');
        setUsingDefaultLocation(true);

        // โหลดข้อมูลด้วยตำแหน่งเริ่มต้น
        loadPlacesWithLocation(defaultLocation);
      }
    }
  }, [location, locationAttempts, usingDefaultLocation, loadPlacesWithLocation]);

  // เพิ่ม function เพื่อเปิดเผยให้กับ parent component สำหรับการรีเฟรชข้อมูล
  useImperativeHandle(ref, () => ({
    // ฟังก์ชันสำหรับรีเฟรชข้อมูล - จะถูกเรียกเมื่อผู้ใช้ pull to refresh
    refreshData: async () => {
      if (location) {
        return loadPlacesWithLocation(location);
      } else if (usingDefaultLocation) {
        return loadPlacesWithLocation(defaultLocation);
      } else {
        // ถ้ายังไม่มีตำแหน่ง และยังไม่ได้ใช้ตำแหน่งเริ่มต้น
        // ให้ใช้ตำแหน่งเริ่มต้นในการดึงข้อมูล
        setUsingDefaultLocation(true);
        return loadPlacesWithLocation(defaultLocation);
      }
    }
  }));

  const renderIcon = (service: { icon: string, iconType: string }) => {
    if (service.iconType === 'Ionicons') {
      return <Ionicons name={service.icon as any} size={RESPONSIVE_SIZES.icon.medium} color="#4A6FA5" />;
    }
    return <MaterialCommunityIcons name={service.icon as any} size={RESPONSIVE_SIZES.icon.medium} color="#4A6FA5" />;
  };

  const handleServicePress = (service: typeof services[0]) => {
    router.push({
      pathname: `/services/${service.id}`,
      params: {
        label: service.label,
        icon: service.icon,
        iconType: service.iconType
      }
    });
  };

  const onPlacePress = (ids: number | string) => {
    console.log('onPlacePress', ids);
    // ถ้าไม่มี หรือ ids ไม่ใช่ number ให้ใช้ router
    router.push({
      pathname: `/places/details`,
      params: {
        id: ids
      }
    });

  };


  // แยกการสร้าง Component สำหรับแสดงรายการสถานที่เพื่อลดการคำนวณซ้ำ
  // ปรับแก้ component PlaceItem ให้รับ props แบบ destructuring แทน
  const PlaceItem = useCallback(({ item, index }: { item: PlaceCard, index: number }) => (
    <TouchableOpacity
      key={index}
      style={styles.placeCard}
      onPress={() => onPlacePress(item.id)}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.placeImage}
            defaultSource={require('@/assets/images/logo.png')}
          />
        ) : (
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.placeImage}
          />
        )}
        {item.airQuality !== undefined && (
          <View style={[
            styles.airQualityBadge,
            item.airQuality == '...' ? styles.DisAirQuality :
              typeof item.airQuality === 'number' && item.airQuality <= 15 ? styles.goodAirQuality :
                typeof item.airQuality === 'number' && item.airQuality <= 30 ? styles.moderateAirQuality :
                  typeof item.airQuality === 'number' && item.airQuality <= 37.5 ? styles.badAirQuality :
                    typeof item.airQuality === 'number' && item.airQuality <= 75 ? styles.verybadAirQuality :
                      styles.dangerAirQuality
          ]}>
            <Text style={[
              styles.airQualityValue,
              item.airQuality == '...' ? styles.DisAirQuality :
                typeof item.airQuality === 'number' && item.airQuality <= 15 ? styles.goodAirQuality :
                  typeof item.airQuality === 'number' && item.airQuality <= 30 ? styles.moderateAirQuality :
                    typeof item.airQuality === 'number' && item.airQuality <= 37.5 ? styles.badAirQuality :
                      typeof item.airQuality === 'number' && item.airQuality <= 75 ? styles.verybadAirQuality :
                        styles.dangerAirQuality
            ]}>{item.airQuality}</Text>
            <Text style={styles.airQualityUnit}>µg/m³</Text>
          </View>
        )}
      </View>
      <View style={styles.placeInfo}>
        {item.name && (
          <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
        )}

        <View style={styles.ratingContainer}>
          <Text style={styles.cuisines} numberOfLines={1}>{item.cuisines}</Text>
        </View>
        <View style={styles.placeDetails}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={RESPONSIVE_SIZES.icon.small} color="#FFD700" />
            <Text style={styles.rating}>{parseFloat(item.rating.toString()).toFixed(1)}</Text>
          </View>
          <View style={styles.distanceContainer}>
            <Text style={styles.distance}><Ionicons name="location-outline" size={RESPONSIVE_SIZES.font.small} color="#666" />{item.distance} กม.</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [onPlacePress]);



  const onTopicPress = (ids: number | string) => {
    router.push({
      pathname: `/articles/${ids}`,
      params: {
        id: ids
      }
    });
  };

  // ฟังก์ชันสำหรับแสดง UI ระหว่างโหลด
  const renderLoadingUI = useCallback(() => {
    const showSkipButton = locationAttempts > 0 && !location && !usingDefaultLocation;

    return (
      <View style={styles.locationLoadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.locationLoadingText}>
          {showSkipButton ?
            `${t('home.searchlocation')} (${locationAttempts}/5)` :
            t('common.loading')}
        </Text>
        {showSkipButton && (
          <TouchableOpacity
            style={styles.skipLocationButton}
            onPress={useDefaultLocation}
          >
            <Text style={styles.skipLocationButtonText}>
              {t('home.skip')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [locationAttempts, location, usingDefaultLocation, useDefaultLocation]);
  return (
    <>
      <View style={styles.bottomSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoRows}>
            <Image
              source={require('@/assets/images/dust-boy.png')}
              style={styles.partnerLogo}
            />
            <Image
              source={require('@/assets/images/cmu-ccdc.png')}
              style={[styles.partnerLogo, styles.partnerLogoXLarge]}
              resizeMode="contain"
            />
            <Image
              source={require('@/assets/images/ruee.png')}
              style={[styles.partnerLogo, styles.partnerLogoLarge]}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceItem}
            onPress={() => handleServicePress(service)}
          >
            <View style={styles.serviceIconContainer}>
              {renderIcon(service)}
            </View>
            <Text style={styles.serviceLabel}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* แสดงส่วนของอากาศดีใกล้คุณ */}
      <View style={{ borderRadius: RESPONSIVE_SIZES.spacing.small }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: RESPONSIVE_SIZES.spacing.medium, marginTop: RESPONSIVE_SIZES.spacing.medium }}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location" size={RESPONSIVE_SIZES.icon.normal} color="#4A6FA5" style={{ marginRight: RESPONSIVE_SIZES.spacing.small }} />
            {t('home.nearby')}
          </Text>
        </View>
        {isLoading ? (
          <View style={styles.sectionContainer}>
            {renderLoadingUI()}
          </View>
        ) : error ? (
          <View style={styles.sectionContainer}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => location ? loadPlacesWithLocation(location) : useDefaultLocation()}
              >
                <Text style={styles.retryButtonText}>{t('home.tryagain')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <View style={styles.placeGrid}>
              {places.length > 0 ? (
                <>
                  {places.slice(0, showAll ? places.length : 6).map((place, index) => (
                    <PlaceItem key={index} item={place} index={index} />
                  ))}

                  {/* "ดูทั้งหมด" ปุ่มที่ย้ายมาอยู่ด้านล่าง */}
                  {places.length > 6 && !showAll && (
                    <View style={{ width: '100%', alignItems: 'center', marginTop: RESPONSIVE_SIZES.spacing.medium }}>
                      <TouchableOpacity
                        onPress={() => handleServicePress({ id: 0, icon: '', label: t('store.all'), iconType: 'string', type: 'string' })}
                        style={styles.viewAllButton}
                      >
                        <Text style={styles.viewAllButtonText}>{t('home.viewall')}</Text>
                        <Ionicons name="arrow-forward" size={RESPONSIVE_SIZES.icon.small} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="alert-circle-outline" size={RESPONSIVE_SIZES.icon.large * 1.3} color="#666" style={{ marginBottom: RESPONSIVE_SIZES.spacing.small }} />
                  <Text style={styles.noDataText}>{t('home.No_good_area')}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => location ? loadPlacesWithLocation(location) : useDefaultLocation()}
                  >
                    <Text style={styles.retryButtonText}>{t('home.tryagain')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* แสดงส่วนของอากาศดียอดนิยม */}
      <View style={{ borderRadius: RESPONSIVE_SIZES.spacing.small }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: RESPONSIVE_SIZES.spacing.medium, marginTop: RESPONSIVE_SIZES.spacing.medium }}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location" size={RESPONSIVE_SIZES.icon.normal} color="#4A6FA5" style={{ marginRight: RESPONSIVE_SIZES.spacing.small }} />
            {t('home.hot')}
          </Text>
        </View>
        {isLoading ? (
          <View style={styles.sectionContainer}>
            {renderLoadingUI()}
          </View>
        ) : error ? (
          <View style={styles.sectionContainer}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => location ? loadPlacesWithLocation(location) : useDefaultLocation()}
              >
                <Text style={styles.retryButtonText}>{t('home.tryagain')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // แสดงรายการสถานที่ยอดนิยมแบบ manual rendering
          <View style={styles.sectionContainer}>
            <View style={styles.placeGrid}>
              {placesHot.length > 0 ? (
                <>
                  {placesHot.slice(0, showAllHot ? placesHot.length : 6).map((place, index) => (
                    <PlaceItem key={`hot_${index}`} item={place} index={index} />
                  ))}

                  {/* "ดูทั้งหมด" ปุ่มที่ย้ายมาอยู่ด้านล่าง */}
                  {placesHot.length > 6 && !showAllHot && (
                    <View style={{ width: '100%', alignItems: 'center', marginTop: RESPONSIVE_SIZES.spacing.medium }}>
                      <TouchableOpacity
                        onPress={() => handleServicePress({ id: 0, icon: '', label: t('store.all'), iconType: 'string', type: 'string' })}
                        style={styles.viewAllButton}
                      >
                        <Text style={styles.viewAllButtonText}>{t('home.viewall')}</Text>
                        <Ionicons name="arrow-forward" size={RESPONSIVE_SIZES.icon.small} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>{t('home.No_good_area')}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => location ? loadPlacesWithLocation(location) : useDefaultLocation()}
                  >
                    <Text style={styles.retryButtonText}>{t('home.tryagain')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
      {/* แสดงข่าวกิจกรรม */}
      <View style={{ backgroundColor: '#ffffff', marginLeft: RESPONSIVE_SIZES.spacing.small, marginRight: RESPONSIVE_SIZES.spacing.small, borderRadius: RESPONSIVE_SIZES.spacing.small, marginTop: RESPONSIVE_SIZES.spacing.small, marginBottom: RESPONSIVE_SIZES.spacing.large * 1.5 }}>
        <View style={[styles.sectionTitleContainer, { marginHorizontal: RESPONSIVE_SIZES.spacing.medium }]}>
          <Ionicons name="book" size={RESPONSIVE_SIZES.icon.normal} color="#4A6FA5" />
          <Text style={[styles.sectionTitle, { marginLeft: RESPONSIVE_SIZES.spacing.small, marginTop: 20 }]}>
            {t('home.knowledge')}
          </Text>
        </View>
        <View style={[styles.sectionContainer]}>
          <View style={styles.knowledgeGrid}>
            <TouchableOpacity style={styles.knowledgeCard} onPress={() => onTopicPress(1)}>
              <View style={styles.knowledgeImageContainer}>
                <Image
                  source={{ uri: (`${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-safety.jpg`) }}
                  style={styles.knowledgeImage}
                  defaultSource={require('@/assets/images/logo.png')}
                />
              </View>
              <View style={styles.knowledgeContent}>
                <Text style={styles.knowledgeTitle}>วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน</Text>
                <Text style={styles.knowledgeDescription} numberOfLines={2}>
                  เรียนรู้วิธีป้องกันตัวเองจากฝุ่นละออง PM2.5 ที่สามารถทำได้ง่ายๆ ในชีวิตประจำวัน
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.knowledgeCard} onPress={() => onTopicPress(2)}>
              <View style={styles.knowledgeImageContainer}>
                <Image
                  source={{ uri: (`${BASEAPI_CONFIG.UrlImg}/uploads/articles/n95-mask.jpg`) }}
                  style={styles.knowledgeImage}
                  defaultSource={require('@/assets/images/logo.png')}
                />
              </View>
              <View style={styles.knowledgeContent}>
                <Text style={styles.knowledgeTitle}>ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง</Text>
                <Text style={styles.knowledgeDescription} numberOfLines={2}>
                  ทำความเข้าใจประสิทธิภาพของหน้ากาก N95 และเหตุผลที่ควรสวมใส่เมื่อค่าฝุ่น PM2.5 สูง
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.knowledgeCard} onPress={() => onTopicPress(3)}>
              <View style={styles.knowledgeImageContainer}>
                <Image
                  source={{ uri: (`${BASEAPI_CONFIG.UrlImg}/uploads/articles/air-purifier-tips.png`) }}
                  style={styles.knowledgeImage}
                  defaultSource={require('@/assets/images/logo.png')}
                />
              </View>
              <View style={styles.knowledgeContent}>
                <Text style={styles.knowledgeTitle}>วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด</Text>
                <Text style={styles.knowledgeDescription} numberOfLines={2}>
                  เคล็ดลับในการใช้เครื่องฟอกอากาศให้เกิดประโยชน์สูงสุดในการกรองฝุ่น PM2.5
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.knowledgeCard} onPress={() => onTopicPress(4)}>
              <View style={styles.knowledgeImageContainer}>
                <Image
                  source={{ uri: (`${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-health-effects.png`) }}
                  style={styles.knowledgeImage}
                  defaultSource={require('@/assets/images/logo.png')}
                />
              </View>
              <View style={styles.knowledgeContent}>
                <Text style={styles.knowledgeTitle}>ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว</Text>
                <Text style={styles.knowledgeDescription} numberOfLines={2}>
                  ทำความเข้าใจผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว และความเสี่ยงที่อาจเกิดขึ้น
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
});

// ต้องมีการเพิ่ม displayName เพื่อให้สามารถใช้ในการ debug ได้ง่ายขึ้น
MainContent.displayName = 'MainContent';

const styles = StyleSheet.create({
  // สไตล์สำหรับการแสดงสถานะการอัพเดทอัตโนมัติ
  autoRefreshIndicator: {
    position: 'absolute',
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: 'rgba(74, 111, 165, 0.1)',
    borderRadius: scaleSize(4),
    padding: scaleSize(4),
    zIndex: 100,
  },
  autoRefreshText: {
    fontSize: RESPONSIVE_SIZES.font.small,
    color: '#4A6FA5',
    fontWeight: 'bold',
  },
  bottomSection: {
    marginTop: scaleSize(0),
    paddingHorizontal: RESPONSIVE_SIZES.spacing.small,
    alignItems: 'flex-start',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    marginRight: RESPONSIVE_SIZES.spacing.small,
    marginLeft: RESPONSIVE_SIZES.spacing.small,
    marginBottom: RESPONSIVE_SIZES.spacing.small,
    borderRadius: RESPONSIVE_SIZES.spacing.small,
    padding: RESPONSIVE_SIZES.spacing.small,

    flex: 2
  },
  logoRow: {
    flexDirection: 'row',
    flex: 2,
  },
  airQualityText: {
    color: 'black',
    fontSize: RESPONSIVE_SIZES.font.normal,
    paddingTop: 12,
    paddingLeft: RESPONSIVE_SIZES.spacing.large,
    fontWeight: '700',
  },
  logoRows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: RESPONSIVE_SIZES.spacing.small,
    gap: scaleSize(2),
    flex: 1,
  },
  partnerLogo: {
    width: RESPONSIVE_SIZES.imageSize.partnerLogo.width,
    height: RESPONSIVE_SIZES.imageSize.partnerLogo.height,
  },
  partnerLogoLarge: {
    width: RESPONSIVE_SIZES.imageSize.partnerLogoLarge.width,
    height: RESPONSIVE_SIZES.imageSize.partnerLogoLarge.height,
  },
  partnerLogoXLarge: {
    width: RESPONSIVE_SIZES.imageSize.partnerLogoXLarge.width,
    height: RESPONSIVE_SIZES.imageSize.partnerLogoXLarge.height,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: RESPONSIVE_SIZES.spacing.medium,
    paddingTop: RESPONSIVE_SIZES.spacing.small,
    paddingBottom: 0,
    zIndex: -99,
    marginLeft: RESPONSIVE_SIZES.spacing.small,
    marginRight: RESPONSIVE_SIZES.spacing.small,
    marginBottom: RESPONSIVE_SIZES.spacing.small,
    borderRadius: RESPONSIVE_SIZES.spacing.small,
    backgroundColor: '#ffffff'
  },
  serviceItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SIZES.spacing.medium,
  },
  serviceIconContainer: {
    width: RESPONSIVE_SIZES.iconContainer.width,
    height: RESPONSIVE_SIZES.iconContainer.height,
    backgroundColor: '#EEF2F8',
    borderRadius: RESPONSIVE_SIZES.iconContainer.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SIZES.spacing.small,
  },
  serviceLabel: {
    fontSize: RESPONSIVE_SIZES.font.small,
    color: '#333',
  },
  sectionContainer: {
    padding: RESPONSIVE_SIZES.spacing.small,
    paddingBottom: RESPONSIVE_SIZES.spacing.large,
    paddingTop: 0,
  },
  locationLoadingContainer: {
    padding: RESPONSIVE_SIZES.spacing.large * 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: RESPONSIVE_SIZES.spacing.normal,
    margin: RESPONSIVE_SIZES.spacing.small,
  },
  locationLoadingText: {
    marginTop: RESPONSIVE_SIZES.spacing.medium,
    color: '#4A6FA5',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  skipLocationButton: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: RESPONSIVE_SIZES.spacing.medium,
    paddingVertical: RESPONSIVE_SIZES.spacing.small,
    borderRadius: RESPONSIVE_SIZES.spacing.small,
    marginTop: RESPONSIVE_SIZES.spacing.medium,
    borderWidth: 1,
    borderColor: '#4A6FA5',
  },
  skipLocationButtonText: {
    color: '#4A6FA5',
    fontWeight: 'bold',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_SIZES.font.medium,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: RESPONSIVE_SIZES.spacing.medium,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeCard: {
    width: '48%',
    marginBottom: RESPONSIVE_SIZES.spacing.medium,
    borderRadius: RESPONSIVE_SIZES.spacing.normal,
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: scaleSize(140),
    borderRadius: RESPONSIVE_SIZES.spacing.normal,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    borderRadius: RESPONSIVE_SIZES.spacing.normal,
  },
  airQualityBadge: {
    position: 'absolute',
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: '#ffffff',
    borderRadius: RESPONSIVE_SIZES.imageSize.airQualityBadge.borderRadius,
    borderWidth: RESPONSIVE_SIZES.imageSize.airQualityBadge.borderWidth,
    width: RESPONSIVE_SIZES.imageSize.airQualityBadge.width,
    height: RESPONSIVE_SIZES.imageSize.airQualityBadge.height,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSize(3),  // ลดขนาด padding
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
  DisAirQuality: {
    borderColor: '#d0d0d0',
    color: '#000'
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
  DisAirQualityText: {
    color: '#d0d0d0',
  },
  airQualityValue: {
    fontSize: RESPONSIVE_SIZES.font.tiny * 1.3,  // ใช้ขนาด font tiny และขยายขึ้นเล็กน้อย
    fontWeight: 'bold',
    marginBottom: 0,
  },
  airQualityUnit: {
    fontSize: RESPONSIVE_SIZES.font.tiny,
    fontWeight: 'bold',
    color: '#000',
    marginTop: scaleSize(-3), // ปรับขนาดระยะห่างให้น้อยลง
  },
  placeInfo: {
    padding: RESPONSIVE_SIZES.spacing.small,
  },
  placeName: {
    fontSize: RESPONSIVE_SIZES.font.normal,
    fontWeight: 'bold',
    marginBottom: RESPONSIVE_SIZES.spacing.tiny,
    color: '#000'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceContainer: {
    width: '50%'
  },
  rating: {
    marginLeft: RESPONSIVE_SIZES.spacing.tiny,
    fontWeight: 'bold',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  cuisines: {
    marginLeft: RESPONSIVE_SIZES.spacing.tiny,
    fontSize: RESPONSIVE_SIZES.font.small,
    color: '#ababab',
    height: scaleSize(30)
  },
  placeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RESPONSIVE_SIZES.spacing.tiny,
  },
  price: {
    fontWeight: 'bold',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  distance: {
    color: '#666',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  loadingContainer: {
    padding: RESPONSIVE_SIZES.spacing.large * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: RESPONSIVE_SIZES.spacing.large * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: RESPONSIVE_SIZES.spacing.medium,
    textAlign: 'center',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  retryButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: RESPONSIVE_SIZES.spacing.medium,
    paddingVertical: RESPONSIVE_SIZES.spacing.small,
    borderRadius: RESPONSIVE_SIZES.spacing.small,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  noDataContainer: {
    width: '100%',
    padding: RESPONSIVE_SIZES.spacing.large * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer2: {
    width: '100%',
    paddingTop: 0,
    marginBottom: scaleSize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#666',
    textAlign: 'center',
    fontSize: RESPONSIVE_SIZES.font.normal,
  },
  // Add these styles to your existing StyleSheet
  knowledgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: RESPONSIVE_SIZES.spacing.large,
  },
  knowledgeCard: {
    width: '49%',
    borderRadius: RESPONSIVE_SIZES.spacing.normal,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: RESPONSIVE_SIZES.spacing.medium,
  },
  knowledgeImageContainer: {
    width: '100%',
    height: scaleSize(160),
    borderTopLeftRadius: RESPONSIVE_SIZES.spacing.normal,
    borderTopRightRadius: RESPONSIVE_SIZES.spacing.normal,
    overflow: 'hidden',
  },
  knowledgeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  knowledgeContent: {
    padding: RESPONSIVE_SIZES.spacing.normal,
  },
  knowledgeTitle: {
    fontSize: RESPONSIVE_SIZES.font.normal,
    fontWeight: 'bold',
    marginBottom: RESPONSIVE_SIZES.spacing.tiny,
    color: '#4A6FA5',
  },
  knowledgeDescription: {
    fontSize: RESPONSIVE_SIZES.font.small,
    color: '#666',
    lineHeight: RESPONSIVE_SIZES.font.medium + 2,
  },
  viewAllButton: {
    backgroundColor: '#3498db',
    paddingVertical: RESPONSIVE_SIZES.spacing.small,
    paddingHorizontal: RESPONSIVE_SIZES.spacing.medium,
    borderRadius: RESPONSIVE_SIZES.spacing.large,
    marginTop: RESPONSIVE_SIZES.spacing.normal,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RESPONSIVE_SIZES.font.normal,
    marginRight: RESPONSIVE_SIZES.spacing.tiny,
  },
});

export default MainContent;

