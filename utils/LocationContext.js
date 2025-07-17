import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, AppState } from 'react-native';
import i18n from '@/i18n'; // เพิ่มบรรทัดนี้
import { useTranslation } from 'react-i18next';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [locationData, setLocationData] = useState({
    location: null,
    address: 'กำลังโหลด...',
    loading: true,
    error: null
  });
const { t } = useTranslation();
  // ฟังก์ชันเพื่อเปิดการตั้งค่าของแอป
  const openSettings = () => {
    Linking.openSettings();
  };

  // ฟังก์ชันตรวจสอบว่า GPS เปิดอยู่หรือไม่
  const checkLocationServices = async () => {
    const providerStatus = await Location.getProviderStatusAsync();
    return providerStatus.locationServicesEnabled;
  };

  const getLocation = async () => {
    try {
      setLocationData(prev => ({ ...prev, loading: true }));

      // ตรวจสอบสถานะสิทธิ์
      const { status } = await Location.getForegroundPermissionsAsync();

      // ขอสิทธิ์หากยังไม่ได้รับ
      if (status !== 'granted') {
        //console.log('ยังไม่ได้รับสิทธิ์ตำแหน่ง กำลังขอสิทธิ์...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

        if (newStatus !== 'granted') {
          console.log('ถูกปฏิเสธสิทธิ์ตำแหน่ง');

          // แสดง alert ให้ผู้ใช้เปิดการตั้งค่า
          Alert.alert(
            "ต้องการสิทธิ์เข้าถึงตำแหน่ง",
            "แอปต้องการสิทธิ์เข้าถึงตำแหน่งของคุณเพื่อแสดงข้อมูลคุณภาพอากาศในพื้นที่ของคุณ",
            [
              { text: "ยกเลิก", style: "cancel" },
              { text: "ไปที่การตั้งค่า", onPress: openSettings }
            ]
          );

          setLocationData({
            location: null,
            address: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง',
            loading: false,
            error: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง'
          });
          return;
        }
      }

      // ตรวจสอบว่า GPS เปิดอยู่หรือไม่
      const locationServicesEnabled = await checkLocationServices();

      if (!locationServicesEnabled) {
        Alert.alert(
          t('common.gps_notopen'),
          t('common.gps_turnon'),
          [{ text: t('common.ok'), style: "default" }]
        );

        setLocationData({
          location: null,
          address: t('common.gps_notopen'),
          loading: false,
          error: t('common.gps_notopen')
        });
        return;
      }

      // ดึงพิกัดปัจจุบัน
      let currentLocation;
      try {
        // ลองใช้ getCurrentPositionAsync ก่อน
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 100
        });
      } catch (posError) {
        console.log('ไม่สามารถรับตำแหน่งปัจจุบันได้ กำลังลองใช้ตำแหน่งล่าสุด:', posError);
        // ถ้าไม่สำเร็จ ลองใช้ getLastKnownPositionAsync
        currentLocation = await Location.getLastKnownPositionAsync();

        if (!currentLocation) {
          // throw new Error('ไม่สามารถระบุตำแหน่งได้'); // <--- This line is commented out, allowing currentLocation to be null
        }
      }

      const coords = {
        latitude: currentLocation.coords.latitude, // <--- Error occurs here if currentLocation is null
        longitude: currentLocation.coords.longitude // <--- Error occurs here if currentLocation is null
      };

      // ตั้งค่าพิกัดทันที
      setLocationData({
        location: coords,
        address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        loading: false,
        error: null
      });

      // แปลงพิกัดเป็นที่อยู่
      try {
        let result = await Location.reverseGeocodeAsync(
          {
            latitude: coords.latitude,
            longitude: coords.longitude
          },
          { locale: i18n.language } // ใช้ภาษาปัจจุบันของแอป
        );

        console.log(result);
        if (result && result.length > 0) {
          const addressParts = [];
          const r = result[0];

          if (r.name) addressParts.push(r.name);
          if (r.street) addressParts.push(r.street);
          if (r.subregion) addressParts.push(r.subregion);
          if (r.district) addressParts.push(r.district);
          if (r.city) addressParts.push(r.city);
          if (r.region) addressParts.push(r.region);
          if (r.country) addressParts.push(r.country);

          const formattedAddress = addressParts.join(', ');

          if (formattedAddress) {
            setLocationData(prev => ({
              ...prev,
              address: formattedAddress
            }));
          }
        }
      } catch (geoError) {
        console.warn('Geocoding failed:', geoError);
      }
    } catch (error) {
      //console.error('Error getting location:', error);
      setLocationData({
        location: null,
        address: 'เกิดข้อผิดพลาดในการรับตำแหน่ง',
        loading: false,
        error: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      });
    }
  };

  // เพิ่ม AppState listener เพื่อตรวจสอบเมื่อแอปกลับมาทำงานอีกครั้ง
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // ตรวจสอบและรีเฟรชตำแหน่งเมื่อแอปกลับมาทำงานอีกครั้ง
        getLocation();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // เรียกฟังก์ชัน getLocation เมื่อ component mount
  useEffect(() => {
    getLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        ...locationData,
        refreshLocation: getLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);