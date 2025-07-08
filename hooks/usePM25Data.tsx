import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '@/utils/LocationContext';
import { fetchStationsByArea } from '@/api/baseapi';
import { useTranslation } from 'react-i18next';

export const usePM25Data = (refreshInterval = 60000) => {
  const [pm25Data, setPM25Data] = useState({
    value: null,
    loading: true,
    error: null,
    quality: null,
    color: '#4CAF50',
    lastUpdated: null
  });
    const { t } = useTranslation();
  const intervalRef = useRef(null);
  const { location, loading: locationLoading, error: locationError } = useLocation();

  const getAirQualityInfo = (value) => {
    if (value <= 15) return { quality: t('airQuality.verygood'), color: '#00BFF3' };
    if (value <= 30) return { quality: t('airQuality.good'), color: '#00A651' };
    if (value <= 37.5) return { quality: t('airQuality.moderate'), color: '#FDC04E' };
    if (value <= 75) return { quality: t('airQuality.unhealthySensitive'), color: '#F26522' };
    return { quality: t('airQuality.unhealthy'), color: '#CD0000' };
  };

  // ใช้ useCallback เพื่อป้องกัน stale closure
  const fetchPM25Data = useCallback(async () => {
    // แสดงรายละเอียดการเรียก API เพื่อช่วยดีบัก
    
    if (locationLoading || locationError || !location) {
      console.log('ไม่สามารถดึงข้อมูลได้: ไม่มีข้อมูลตำแหน่ง');
      return;
    }
    
    try {
      setPM25Data(prev => ({ ...prev, loading: true }));
      
      const { latitude, longitude } = location;
      
      const response = await fetchStationsByArea(latitude, longitude, 50);
      
      // ตรวจสอบโครงสร้างข้อมูลอย่างถูกต้อง
      if (!response || !response[0] || !response[0].stations || !response[0].stations[0]) {
        throw new Error('ไม่พบข้อมูลจากสถานีวัดใกล้เคียง');
      }
      
      // ใช้ค่า aqi หรือ pm25 (ถ้ามี)
      const pm25Value = response[0].stations[0].aqi || response[0].stations[0].pm25 || 0;
      
      
      const qualityInfo = getAirQualityInfo(pm25Value);
      
      setPM25Data({
        value: pm25Value,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        ...qualityInfo
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล PM2.5:', error);
      setPM25Data(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        quality: 'ไม่พบข้อมูล',
        color: '#9E9E9E',
        lastUpdated: new Date()
      }));
    }
  }, [location, locationLoading, locationError]);

  // สำหรับทดสอบ
  const fetchMockPM25Data = useCallback(() => {
    setPM25Data(prev => ({ ...prev, loading: true }));
    
    setTimeout(() => {
      const mockValue = Math.floor(Math.random() * 250);
      const qualityInfo = getAirQualityInfo(mockValue);
      
      setPM25Data({
        value: mockValue,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        ...qualityInfo
      });
    }, 500);
  }, []);

  // ฟังก์ชันรีเฟรชข้อมูล (export เพื่อให้เรียกใช้จากภายนอก)
  const refreshData = useCallback(() => {
    fetchPM25Data();
    // fetchMockPM25Data(); // สลับคอมเมนต์เพื่อทดสอบ
  }, [fetchPM25Data]);

  // ตั้งค่าการดึงข้อมูลอัตโนมัติ
  useEffect(() => {    
    // เคลียร์ interval เดิม
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // ดึงข้อมูลครั้งแรก
    if (!locationLoading && !locationError && location) {
      fetchPM25Data();
      
      // ตั้ง interval ใหม่
      intervalRef.current = setInterval(() => {
        fetchPM25Data();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location, locationLoading, locationError, refreshInterval, fetchPM25Data]);

  return {
    ...pm25Data,
    refresh: refreshData
  };
};