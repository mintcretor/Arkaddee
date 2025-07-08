// services/DataProviders/OutdoorDataProvider.js
import AqiCacheService from '@/utils/AqiCacheService';

class OutdoorDataProvider {
  constructor() {
    this.sourceId = 'secondary';
    this.sourceName = 'ภายนอกอาคาร';
  }

  // ดึงข้อมูลจาก API
  async fetchData() {
    try {
      const response = await AqiCacheService.getAqiData(this.sourceId);
      return this.formatData(response);
    } catch (error) {
      console.error('Error fetching outdoor AQI data:', error);
      throw error;
    }
  }

  // แปลงข้อมูลให้เป็นรูปแบบที่ใช้งานได้
  formatData(data) {
    try {
      if (!data) {
        console.warn(`ไม่มีข้อมูลจาก API ภายนอกอาคาร`);
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.warn('ข้อมูล API ภายนอกอาคารไม่ใช่อาร์เรย์');
        return [];
      }
      
      const formattedData = data
        .filter(point => {
         if (!point) return false;
          
          // ตรวจสอบ latitude และ longitude
          const lat = parseFloat(point?.latitude || '');
          const lng = parseFloat(point?.longitude || '');
          if (isNaN(lat) || isNaN(lng)) return false;
          
          // ตรวจสอบชื่อสถานี - ไม่แสดงถ้าขึ้นต้นด้วย TX หรือ RX
          const stationName = point?.name || '';
          if (stationName.toUpperCase().startsWith('TX') || 
              stationName.toUpperCase().startsWith('RX')) {
            return false;
          }
          
          return true;
        })
        .map(point => ({
          latitude: parseFloat(point?.latitude || 0),
          longitude: parseFloat(point?.longitude || 0),
          aqi: parseFloat(point?.pm25 || 0),
          id: point?.id || `marker-${Date.now()}-${Math.random()}`,
          dustboy_name: point?.name || t('common.Not_specified'),
          log_datetime: point?.timestamp || new Date().toISOString(),
          temperature: parseFloat(point?.temperature || 0) || null,
          humidity: parseFloat(point?.humidity || 0) || null,
          pm10: parseFloat(point?.pm10 || 0) || null,
          aqi_us: parseFloat(point?.aqi_us || 0) || null,
          aqi_th: parseFloat(point?.aqi_th || 0) || null
        }));
      
      return formattedData;
    } catch (error) {
      console.error(`Error formatting outdoor data:`, error);
      return []; // ส่งคืนอาร์เรย์ว่างในกรณีที่มีข้อผิดพลาด
    }
  }
}

export default OutdoorDataProvider;