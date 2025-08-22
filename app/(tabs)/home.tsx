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
  RefreshControl  // เพิ่มการนำเข้า RefreshControl
} from 'react-native';
import Header from '@/components/Header';
import MainContent from '@/components/home/MainContent';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface HomeScreenProps {
  navigation?: any; // เพิ่ม ? เพื่อให้เป็น optional
}

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
  
  const handlePlacePress = (placeId: number) => {
    setSelectedShop(placeId);
  };

  const handleBackToMain = () => {
    setSelectedShop(null);
  };
  
  // ฟังก์ชันสำหรับการ pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // สร้าง reference ไปยัง MainContent component เพื่อเรียกใช้ฟังก์ชันรีเฟรชภายใน
    // สมมติว่ามีฟังก์ชัน refreshData ใน MainContent
    if (mainContentRef.current) {
      // เรียกใช้ฟังก์ชัน refreshData ของ MainContent (ต้องเพิ่มเมธอดนี้ใน MainContent)
      mainContentRef.current.refreshData().then(() => {
        // เมื่อโหลดข้อมูลเสร็จแล้ว ปิดสถานะ refreshing
        setRefreshing(false);
      }).catch((error) => {
        console.error("Error refreshing data:", error);
        setRefreshing(false);
      });
    } else {
      // กรณีไม่สามารถเข้าถึง MainContent ให้ปิดสถานะ refreshing หลังจากผ่านไป 1 วินาที
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  }, []);

  // สร้าง ref สำหรับ MainContent component
  const mainContentRef = useRef(null);
  
  // ฟังก์ชันเมื่อกดปุ่ม FAB
  const handleFabPress = () => {
    if (isExpanded) {
      // ถ้าปุ่มกำลังแสดงข้อความ ให้เปิด URL ภายนอก
      Linking.openURL('https://www.arkaddee.com/Registration')
        .catch(err => console.error('เกิดข้อผิดพลาดในการเปิด URL:', err));
    } else {
      // ถ้าปุ่มยังไม่แสดงข้อความ ให้ขยายปุ่มออก
      setIsExpanded(true);
      
      // Animation สำหรับขยายความกว้าง
      Animated.timing(animatedWidth, {
        toValue: 220, // ความกว้างเมื่อขยาย
        duration: 300, // ระยะเวลา animation (milliseconds)
        easing: Easing.out(Easing.ease),
        useNativeDriver: false // required for width animation
      }).start();
      
      // Animation สำหรับแสดงข้อความ
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        delay: 100, // เริ่มหลังจากปุ่มขยายเล็กน้อย
        useNativeDriver: false
      }).start();
      
      // ตั้งเวลาให้หดกลับหลังจาก 3 วินาที
      setTimeout(() => {
        collapseButton();
      }, 3000);
    }
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
      toValue: 60, // กลับไปขนาดเดิม
      duration: 300,
      delay: 50, // เริ่มหลังจากข้อความซ่อนเล็กน้อย
      easing: Easing.in(Easing.ease),
      useNativeDriver: false
    }).start(() => {
      setIsExpanded(false);
    });
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
       <Header />
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          // เพิ่ม RefreshControl สำหรับ pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A6FA5']}  // สีของตัวโหลดสำหรับ Android
              tintColor="#4A6FA5"   // สีของตัวโหลดสำหรับ iOS
              title="กำลังโหลดข้อมูล..."  // ข้อความที่แสดงใต้ตัวโหลดสำหรับ iOS
              titleColor="#4A6FA5"  // สีของข้อความสำหรับ iOS
            />
          }
        >

          <MainContent
            onPlacePress={handlePlacePress}
            navigation={navigation}
            ref={mainContentRef}  // เพิ่ม ref เพื่อให้สามารถเข้าถึง MainContent ได้
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
            >
            {t('home.freeregister')}
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 28, // รองรับสถานะบาร์บน Android
  },
  safeArea: {
    flex: 1,
 
  },
  // แยก style พื้นฐานสำหรับปุ่ม FAB
  fabButtonBase: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    backgroundColor: '#4A6FA5',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    height: 40, // กำหนดความสูงคงที่
    paddingLeft: 0, // ปรับค่า padding ใหม่เพื่อให้ animation ทำงานได้ดีขึ้น
    paddingRight: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 9999,
    overflow: 'hidden', // สำคัญสำหรับ animation ของข้อความ
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
  },
});

export default HomeScreen;