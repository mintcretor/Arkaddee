import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Linking,
  SafeAreaView,
  Animated,
  Platform,
  StatusBar,
  TouchableOpacity,
  Easing,
  RefreshControl,
  Text
} from 'react-native';
import Header from '@/components/Header';
import MainContent from '@/components/home/MainContent';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface HomeScreenProps {
  navigation?: any; // เพิ่ม ? เพื่อให้เป็น optional
}

const HEADER_HEIGHT = 150;    // ความสูงของ Header รวมส่วนโค้ง
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const router = useRouter();
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();
  
  // State และ animation values สำหรับปุ่ม FAB
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedWidth = useRef(new Animated.Value(60)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // เพิ่ม state สำหรับ pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlacePress = (placeId: number) => {
    setSelectedShop(placeId);
  };

  const handleBackToMain = () => {
    setSelectedShop(null);
  };

  // ฟังก์ชันสำหรับการ pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      // ถ้ามี MainContent ref และมีฟังก์ชัน refreshData
      if (mainContentRef.current?.refreshData) {
        await mainContentRef.current.refreshData();
      } else {
        // ถ้าไม่มี ก็แค่รอสักพัก
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err: any) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      console.error('เกิดข้อผิดพลาดในการรีเฟรช:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // สร้าง ref สำหรับ MainContent component
  const mainContentRef = useRef<any>(null);

  // ฟังก์ชันเมื่อกดปุ่ม FAB
  const handleFabPress = () => {
    if (isExpanded) {
      // ถ้าปุ่มกำลังแสดงข้อความ ให้เปิด URL ภายนอก
      Linking.openURL('https://www.arkaddee.com/Registration')
        .catch(err => console.error('เกิดข้อผิดพลาดในการเปิด URL:', err));
    } else {
      // ถ้าปุ่มยังไม่แสดงข้อความ ให้ขยายปุ่มออก
      expandButton();
    }
  };

  // ฟังก์ชันสำหรับขยายปุ่ม
  const expandButton = () => {
    setIsExpanded(true);

    // Animation สำหรับขยายความกว้าง
    Animated.timing(animatedWidth, {
      toValue: 220, // ความกว้างเมื่อขยาย
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start();

    // Animation สำหรับแสดงข้อความ
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 200,
      delay: 100,
      useNativeDriver: false
    }).start();

    // ตั้งเวลาให้หดกลับหลังจาก 3 วินาที
    setTimeout(() => {
      collapseButton();
    }, 3000);
  };

  // ฟังก์ชันสำหรับหดปุ่มกลับ
  const collapseButton = () => {
    // Animation สำหรับซ่อนข้อความ
    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false
    }).start();

    // Animation สำหรับหดความกว้าง
    Animated.timing(animatedWidth, {
      toValue: 60,
      duration: 300,
      delay: 50,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false
    }).start(() => {
      setIsExpanded(false);
    });
  };

  return (
    <View style={styles.container}>
         <StatusBar
               barStyle="dark-content"
               backgroundColor="#ffffff"
               translucent={true}
             />
      
      {/* Fixed Header - ไม่ scroll */}
        <View style={styles.headerContainer}>
      <Header />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          // เพิ่ม RefreshControl สำหรับ pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A6FA5']}        // สีของตัวโหลดสำหรับ Android
              tintColor="#4A6FA5"         // สีของตัวโหลดสำหรับ iOS
              title={t('home.refreshing') || 'กำลังโหลดข้อมูล...'}
              titleColor="#4A6FA5"        // สีของข้อความสำหรับ iOS
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <MainContent
            onPlacePress={handlePlacePress}
            navigation={navigation}
            ref={mainContentRef}
          />
        </Animated.ScrollView>

        {/* ปุ่ม FAB ที่มี animation */}
        <Animated.View
          style={[
            styles.fabButtonBase,
            { width: animatedWidth }
          ]}
        >
          <TouchableOpacity
            style={styles.fabContent}
            onPress={handleFabPress}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Animated.Text
              style={[
                styles.fabText,
                { opacity: textOpacity }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.freeregister')}
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>

        {/* แสดง error message ถ้ามี */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',

  },
    headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 35 : 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // ใช้ transparent เพื่อให้เห็นพื้นหลัง
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,           // เพิ่ม padding top เล็กน้อยเพื่อให้เว้นระยะจากส่วนโค้ง
    paddingBottom: 100,       // เว้นพื้นที่สำหรับ FAB
  },
  // แยก style พื้นฐานสำหรับปุ่ม FAB
  fabButtonBase: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    backgroundColor: '#4A6FA5',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    height: 40,
    paddingLeft: 0,
    paddingRight: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 9999,
    overflow: 'hidden',
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
    height: '100%',
  },
  fabText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
    flexShrink: 1,              // ป้องกันข้อความล้น
  },
  errorContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    zIndex: 1000,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;