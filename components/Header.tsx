import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ImageBackground, Image, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/utils/LocationContext';
import { useAuth } from '@/hooks/useAuth';
import { usePM25Data } from '@/hooks/usePM25Data';
import { useTranslation } from 'react-i18next';

// กำหนด Props (ถ้ามี)
interface HeaderProps {
  // ใส่ props ที่ต้องการเพิ่มเติมตรงนี้
}

const Header: React.FC<HeaderProps> = () => {
  const { address, loading: locationLoading, error: locationError } = useLocation();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  
  // ใช้ usePM25Data hook ที่อัปเดตแล้ว พร้อมกำหนดเวลารีเฟรชเป็นทุก 30 วินาที
  const { 
    value, 
    loading: pm25Loading, 
    error: pm25Error, 
    color, 
    quality,
    lastUpdated,
    refresh 
  } = usePM25Data(30000); // รีเฟรชทุก 30 วินาที
  
  // แสดงเวลาล่าสุดที่อัปเดตข้อมูล
  const [timeText, setTimeText] = useState<string>('');
  
  // รับค่าความกว้างของหน้าจอ
  const screenWidth = Dimensions.get('window').width;
  
  // อัปเดตเวลาล่าสุดทุกวินาที
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateTimeText = () => {
      if (!lastUpdated) return;
      
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000); // ต่างกันกี่วินาที
      
      if (diff < 60) {
        setTimeText(`${diff} วินาทีที่แล้ว`);
      } else if (diff < 3600) {
        setTimeText(`${Math.floor(diff / 60)} นาทีที่แล้ว`);
      } else {
        setTimeText(`${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`);
      }
    };
    
    // เรียกฟังก์ชันครั้งแรก
    updateTimeText();
    
    // ตั้งค่า interval เพื่ออัปเดตเวลาทุกวินาที
    const interval = setInterval(updateTimeText, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  // แสดงข้อความตามสถานะของตำแหน่ง
  const displayAddress = locationError || (locationLoading ? t('common.loading') : address);

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={require('@/assets/images/bg_header1.png')}
        style={styles.container}
        imageStyle={styles.backgroundImage}
      >
        {/* Logo และข้อมูลด้านซ้าย */}
        <View style={styles.leftContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/logo2.png')}
              style={styles.logo} 
            />
          </View>
          
          <View style={styles.textContent}>
            <Text 
              style={styles.greeting}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.displayName || user?.username || "ผู้ใช้งาน"}
            </Text>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="white" style={styles.locationIcon} />
              <Text 
                style={styles.locationText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {displayAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* PM2.5 ด้านขวา */}
        <TouchableOpacity 
          style={styles.pmContainer}
          onPress={refresh} // เพิ่มการรีเฟรชข้อมูลเมื่อกดที่กล่อง PM2.5
          activeOpacity={0.7}
        >
          <Text style={styles.pmLabel}>PM2.5</Text>
          <View style={[styles.pmValueBox, { borderColor: color }]}>
            {pm25Loading ? (
              <ActivityIndicator size="small" color={color} />
            ) : pm25Error ? (
              <Text style={[styles.pmValue, { fontSize: 16, color: '#9E9E9E' }]}>--</Text>
            ) : (
              <>
                <Text style={[styles.pmValue, { color }]}>{value}</Text>
                <Text style={[styles.pmUnit, { color }]}>µg/m³</Text>
              </>
            )}
          </View>
          <Text 
            style={[styles.qualityText, { color }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {quality || t('common.Not_specified')}
          </Text>
          
          {/* แสดงเวลาอัปเดตล่าสุด */}
          {timeText && !pm25Loading && (
            <Text style={styles.lastUpdatedText}>
              {timeText}
            </Text>
          )}
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#4A6FA5', // สีพื้นหลังสำรอง
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  container: {
    flexDirection: 'row',
    height: 140,              // กำหนดความสูงคงที่
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 15,
    paddingBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',            // เปลี่ยนจาก 150% เป็น 100%
    height: '100%',           // เปลี่ยนเป็น 100%
    resizeMode: 'cover',      // เปลี่ยนจาก stretch เป็น cover
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    height: '100%',
  },
  logoContainer: {
    width: 80,                // กำหนดพื้นที่สำหรับ logo
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {                     // เปลี่ยนชื่อจาก logos เป็น logo
    width: 75,                // ลดขนาดลง
    height: 75,               // ลดขนาดลง
    resizeMode: 'contain',
    // ลบ position absolute ออก
  },
  textContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    height: '100%',
  },
  greeting: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    marginBottom: 8,
    paddingTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
    paddingRight: 5,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 4,
    flexShrink: 0,            // ป้องกัน icon ถูกบีบ
  },
  locationText: {
    color: 'white',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  pmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    minHeight: 100,           // กำหนดความสูงขั้นต่ำ
  },
  pmLabel: {
    color: 'white',
    fontSize: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  pmValueBox: {
    backgroundColor: '#ffffff',
    width: 60,
    height: 60,
    borderRadius: 30,         // เปลี่ยนจาก 50 เป็น 30 เพื่อให้เป็นวงกลมที่สมบูรณ์
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,           // ลดจาก 5 เป็น 3
    borderColor: '#4CAF50',   // สีเริ่มต้น จะถูกแทนที่
  },
  pmValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pmUnit: {
    fontSize: 8,              // ลดขนาดตัวอักษร
    textAlign: 'center',
  },
  qualityText: {
    fontSize: 10,
    marginTop: 4,
    color: 'white',
    width: 70,
    textAlign: 'center',
  },
  lastUpdatedText: {
    fontSize: 8,
    color: 'white',
    marginTop: 2,
    opacity: 0.8,
    textAlign: 'center',
  }
});

export default Header;