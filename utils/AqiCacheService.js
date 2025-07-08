// src/utils/AqiCacheService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAqiThai, fetchAqiArkad } from '@/api/baseapi';

const CACHE_KEYS = {
  default: 'cached_aqi_data_default',
  secondary: 'cached_aqi_data_secondary',
};


const CACHE_TIMESTAMP_KEYS = {
  default: 'cached_aqi_timestamp_default',
  secondary: 'cached_aqi_timestamp_secondary',
};

const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 ชั่วโมง

export const AqiCacheService = {
  // บันทึกข้อมูล AQI ลงใน AsyncStorage
  saveAqiData: async (data, apiSource = 'default') => {
    try {
      const cacheKey = CACHE_KEYS[apiSource] || CACHE_KEYS.default;
      const timestampKey = CACHE_TIMESTAMP_KEYS[apiSource] || CACHE_TIMESTAMP_KEYS.default;

      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(cacheKey, jsonData);
      await AsyncStorage.setItem(timestampKey, Date.now().toString());
      //console.log(`บันทึกข้อมูล AQI (${apiSource}) ลงแคชเรียบร้อย`);
      return true;
    } catch (error) {
      console.error(`ไม่สามารถบันทึกข้อมูล AQI (${apiSource}) ลงแคช:`, error);
      return false;
    }
  },

  // ดึงข้อมูล AQI จาก AsyncStorage
  getCachedAqiData: async (apiSource = 'default') => {
    try {
      const cacheKey = CACHE_KEYS[apiSource] || CACHE_KEYS.default;
      const timestampKey = CACHE_TIMESTAMP_KEYS[apiSource] || CACHE_TIMESTAMP_KEYS.default;

      const jsonData = await AsyncStorage.getItem(cacheKey);
      const timestamp = await AsyncStorage.getItem(timestampKey);

      if (!jsonData || !timestamp) {
        return null;
      }

      // ตรวจสอบอายุของข้อมูลในแคช
      const cacheAge = Date.now() - parseInt(timestamp, 10);
      if (isNaN(cacheAge) || cacheAge > CACHE_EXPIRY_TIME) {
        console.log(`ข้อมูลในแคช (${apiSource}) ไม่ถูกต้องหรือเก่าเกินไป`);
        return null;
      }

      return JSON.parse(jsonData);
    } catch (error) {
      console.error(`ไม่สามารถดึงข้อมูล AQI (${apiSource}) จากแคช:`, error);
      return null;
    }
  },

  // ดึงข้อมูลจากแคชก่อน ถ้าไม่มีหรือหมดอายุจะดึงจาก API
  getAqiData: async (apiSource = 'default') => {
    try {
      console.log('กำลังโหลดข้อมูลจาก API source:', apiSource);

      // ลองดึงข้อมูลจากแคชก่อน
      const cachedData = await AqiCacheService.getCachedAqiData(apiSource);
      if (cachedData) {
        console.log(`ใช้ข้อมูล AQI (${apiSource}) จากแคช`);
        return cachedData;
      }

      // ถ้าไม่มีข้อมูลในแคชหรือข้อมูลหมดอายุ ให้ดึงข้อมูลใหม่จาก API
      console.log(`ดึงข้อมูล AQI ใหม่จาก API (${apiSource})`);

      let apiData;
      // เลือก API ตามแหล่งที่กำหนด
      switch (apiSource) {
        case 'secondary':
          apiData = await fetchAqiArkad();
          break;
        case 'default':
          apiData = await fetchAqiThai();
          break;
        default:
          console.warn(`API source ที่ไม่รู้จัก: ${apiSource}`);
          apiData = await fetchAqiThai();
      }


      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        // บันทึกข้อมูลใหม่ลงในแคช
        await AqiCacheService.saveAqiData(apiData, apiSource);
        return apiData;
      }

      return null;
    } catch (error) {
      console.error(`ไม่สามารถดึงข้อมูล AQI (${apiSource}):`, error);
      return null;
    }
  },

  // ดึงข้อมูลล่วงหน้าเมื่อแอปเริ่มทำงาน
  prefetchAqiData: async (apiSource = 'default') => {
    try {
      let apiData;
      // เลือก API ตามแหล่งที่กำหนด
      switch (apiSource) {
        case 'secondary':
          apiData = await fetchAqiArkad();
          break;
        case 'default':
        default:
          apiData = await fetchAqiThai();
          break;
      }

      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        await AqiCacheService.saveAqiData(apiData, apiSource);
        //console.log(`ดึงข้อมูล AQI (${apiSource}) ล่วงหน้าเสร็จสิ้น`);
        return true;
      }

      return false;
    } catch (error) {
      //console.error(`ไม่สามารถดึงข้อมูล AQI (${apiSource}) ล่วงหน้า:`, error);
      return false;
    }
  },

  // ล้างข้อมูลในแคช
  clearCache: async (apiSource) => {
    try {
      if (apiSource) {
        // ล้างเฉพาะแคชของแหล่งข้อมูลที่ระบุ
        const cacheKey = CACHE_KEYS[apiSource] || CACHE_KEYS.default;
        const timestampKey = CACHE_TIMESTAMP_KEYS[apiSource] || CACHE_TIMESTAMP_KEYS.default;

        await AsyncStorage.removeItem(cacheKey);
        await AsyncStorage.removeItem(timestampKey);
        console.log(`ล้างแคช AQI (${apiSource}) เรียบร้อย`);
      } else {
        // ล้างแคชทั้งหมด
        for (const source in CACHE_KEYS) {
          await AsyncStorage.removeItem(CACHE_KEYS[source]);
          await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEYS[source]);
        }
        console.log('ล้างแคช AQI ทั้งหมดเรียบร้อย');
      }
      return true;
    } catch (error) {
      console.error('ไม่สามารถล้างแคช:', error);
      return false;
    }
  }
};

export default AqiCacheService;