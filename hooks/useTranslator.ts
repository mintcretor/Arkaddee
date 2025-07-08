// src/hooks/useTranslator.ts
import { useState, useEffect } from 'react';
import { translateWithLingva } from '@/utils/translator'; // นำเข้า translator
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Hook สำหรับจัดการการแปลภาษา
export const useTranslator = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('th'); // ภาษาเริ่มต้น
  const [loading, setLoading] = useState<boolean>(false);
  
  // โหลดภาษาปัจจุบันเมื่อ hook เริ่มทำงาน
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // ตรวจสอบว่ามีภาษาที่บันทึกไว้หรือไม่
        const savedLanguage = await AsyncStorage.getItem('app-language');
        
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        } else {
          // ถ้าไม่มี ใช้ภาษาของอุปกรณ์
          const deviceLanguage = Localization.locale.split('-')[0];
          const defaultLang = ['th', 'en'].includes(deviceLanguage) ? deviceLanguage : 'th';
          setCurrentLanguage(defaultLang);
          await AsyncStorage.setItem('app-language', defaultLang);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    
    loadLanguage();
  }, []);
  
  // ฟังก์ชันสำหรับแปลข้อความ
  const translate = async (text: string, targetLang?: string) => {
    if (!text) return '';
    setLoading(true);
    
    try {
      const toLang = targetLang || currentLanguage;
      const result = await translateWithLingva(text, toLang);
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      setLoading(false);
      return text;
    }
  };
  
  // ฟังก์ชันเปลี่ยนภาษา
  const changeLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem('app-language', language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };
  
  return {
    currentLanguage,
    translate,
    changeLanguage,
    loading
  };
};