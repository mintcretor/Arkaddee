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
    <ImageBackground
      source={require('@/assets/images/bg_header1.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      {/* Logo และข้อมูลด้านซ้าย */}
      <View style={[styles.leftContent, { width: screenWidth - 90 }]}>
        <Image 
          source={require('@/assets/images/logo2.png')}
          style={styles.logos} 
        />
        <Text 
          style={styles.greeting}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          { user?.displayName || user?.username || "ผู้ใช้งาน"}
        </Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="white" style={styles.locationIcon} />
          <Text 
            style={[styles.locationText, { width: screenWidth - 150 }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {displayAddress}
          </Text>
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
      </TouchableOpacity>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingTop: 10,
    paddingLeft: 20,
    justifyContent: 'space-between',
  },
  backgroundImage: {
    width: '150%',
    height: 140,
    resizeMode: 'stretch',
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
  },
  logo: {
  
    paddingLeft: 20,
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  logos: {
    width: 150,
    height: 120,
    top: -45,
    zIndex: 1,
    position: 'absolute',
    resizeMode: 'contain',
  },
  greeting: {
    paddingTop: 35,
    paddingLeft: 40,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
 
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // เปลี่ยนเป็น flex-start เพื่อให้ icon อยู่ชิดบน
    marginLeft: 25,
    marginRight: 5,
  },
  locationIcon: {
    marginTop: 3, // เพิ่ม margin top เพื่อให้ icon อยู่ในตำแหน่งที่เหมาะสม
    marginRight: 4,
  },
  locationText: {
    color: 'white',
    fontSize: 11,
    lineHeight: 15,
    marginRight: 5,
  },
  pmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    width: 70, // กำหนดความกว้างคงที่
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
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#4CAF50', // สีเริ่มต้น จะถูกแทนที่
  },
  pmValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pmUnit: {
    fontSize: 10,
  },
  qualityText: {
    fontSize: 10,
    marginTop: 2,
    color: 'white',
    width: 70,
    textAlign: 'center',
  },
  lastUpdatedText: {
    fontSize: 8,
    color: 'white',
    marginTop: 1,
    opacity: 0.8,
  }
});

export default Header;