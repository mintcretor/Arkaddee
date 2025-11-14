// i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ลบบรรทัดนี้ออก
// import * as Localization from 'expo-localization';

// นำเข้าไฟล์แปลภาษา
import en from './translations/en';
import th from './translations/th';

// กำหนดภาษาเริ่มต้น
const defaultLanguage = 'th';

// แก้ไขฟังก์ชันนี้ให้ไม่ใช้ Localization
const detectUserLanguage = async () => {
  try {
    // พยายามดึงภาษาที่จัดเก็บไว้
    const savedLanguage = await AsyncStorage.getItem('user-language');
    
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // ใช้ค่าเริ่มต้นเป็น 'en' โดยไม่ต้องตรวจสอบภาษาอุปกรณ์
    return defaultLanguage;
  } catch (error) {
    console.error("Error detecting language:", error);
    return defaultLanguage;
  }
};

// ตั้งค่า i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      th: { translation: th }
    },
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false
    }
  });

// โหลดภาษาที่บันทึกไว้
detectUserLanguage().then(language => {
  i18n.changeLanguage(language);
  console.log('Language initialized:', language);
});

export default i18n;