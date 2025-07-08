// services/DataProviders/DataProviderFactory.js
import IndoorDataProvider from './IndoorDataProvider';
import OutdoorDataProvider from './OutdoorDataProvider';
import { useTranslation } from 'react-i18next';


// แฟคทอรี่สำหรับเลือกใช้ provider ตามประเภท
class DataProviderFactory {


  
  static getProvider(type) {
    switch (type) {
      case 'default':
        return new IndoorDataProvider();
      case 'secondary':
        return new OutdoorDataProvider();
      default:
        // ค่าเริ่มต้นเป็น indoor
        return new IndoorDataProvider();
    }
  }

  // ส่งคืนรายการประเภทของ provider ที่มี
  static getAvailableProviders() {
    const { t } = useTranslation();
    return [
      { id: 'default', name: t('airQuality.indoors') },
      { id: 'secondary', name:  t('airQuality.outdoors')},
    ];
  }

  // หาชื่อของ provider จาก id
  static getProviderName(id) {
    const provider = this.getAvailableProviders().find(p => p.id === id);
    return provider ? provider.name : 'ไม่ทราบแหล่งข้อมูล';
  }
}

export default DataProviderFactory;