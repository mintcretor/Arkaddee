import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, StyleSheet } from 'react-native'; // เพิ่ม StyleSheet
// import { SafeAreaView } from 'react-native'; // ไม่จำเป็นต้องใช้ SafeAreaView ที่นี่ ถ้าใช้ useSafeAreaInsets กับ tabBarStyle
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // *** สำคัญ: เพิ่มการนำเข้านี้ ***

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // *** ดึงค่า insets ที่นี่ ***

  useEffect(() => {
    // เฉพาะเพื่อการ re-render เมื่อภาษาเปลี่ยนแปลง
  }, [i18n.language]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#4B74B3' : '#4B74B3',
        
        },
        tabBarInactiveTintColor: '#fff',
        tabBarActiveTintColor: '#000',

      }}
    >
      <Tabs.Screen
        name="myhome"
        options={{
          title: t('myhome.myhome'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="air-quality"
        options={{
          title: t('airQuality.airQualitys'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="home" // *** ตรวจสอบชื่อนี้: มี "home" สองอัน ควรเปลี่ยนเป็นชื่ออื่นถ้าเป็นคนละหน้ากัน ***
        options={{
          title: '', // ไม่มีข้อความสำหรับแท็บนี้
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 5,
              borderColor: '#fff',
              // ปรับตำแหน่ง icon ให้ลอยขึ้นมาเหนือ Tab Bar เล็กน้อย
              marginTop: -25, // ลองปรับค่านี้
            }}>
              <View style={{
                backgroundColor: '#0066FF', // สีฟ้าเข้มตรงกลาง
                width: 60,
                height: 60,
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons
                  name="grid"
                  size={35}
                  color="#FFF"
                />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="product"
        options={{
          title: t('Product.product'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}