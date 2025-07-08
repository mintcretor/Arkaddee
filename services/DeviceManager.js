// DeviceManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ดึงรายการอุปกรณ์ทั้งหมด
export const getDevices = async () => {
  try {
    const devicesJson = await AsyncStorage.getItem('devices');
    return devicesJson ? JSON.parse(devicesJson) : [];
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
};

// ดึงข้อมูลอุปกรณ์เดียว
export const getDeviceById = async (deviceId) => {
  try {
    const devices = await getDevices();
    return devices.find(d => d.id === deviceId) || null;
  } catch (error) {
    console.error('Error getting device:', error);
    return null;
  }
};

// เพิ่มหรืออัปเดตอุปกรณ์
export const saveDevice = async (device) => {
  try {
    const devices = await getDevices();
    const existingIndex = devices.findIndex(d => d.id === device.id);
    
    if (existingIndex >= 0) {
      devices[existingIndex] = {...devices[existingIndex], ...device};
    } else {
      devices.push(device);
    }
    
    await AsyncStorage.setItem('devices', JSON.stringify(devices));
    return true;
  } catch (error) {
    console.error('Error saving device:', error);
    return false;
  }
};

// ลบอุปกรณ์
export const deleteDevice = async (deviceId) => {
  try {
    const devices = await getDevices();
    const filteredDevices = devices.filter(d => d.id !== deviceId);
    await AsyncStorage.setItem('devices', JSON.stringify(filteredDevices));
    return true;
  } catch (error) {
    console.error('Error deleting device:', error);
    return false;
  }
};

// อัปเดตสถานะล่าสุดของอุปกรณ์
export const updateDeviceStatus = async (deviceId, statusData) => {
  try {
    const device = await getDeviceById(deviceId);
    if (device) {
      device.lastStatus = statusData;
      device.lastUpdated = new Date().toISOString();
      await saveDevice(device);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating device status:', error);
    return false;
  }
};

// ตั้งค่าห้องสำหรับอุปกรณ์
export const setDeviceRoom = async (deviceId, room) => {
  try {
    const device = await getDeviceById(deviceId);
    if (device) {
      device.room = room;
      await saveDevice(device);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting device room:', error);
    return false;
  }
};

// เปลี่ยนชื่ออุปกรณ์
export const renameDevice = async (deviceId, newName) => {
  try {
    const device = await getDeviceById(deviceId);
    if (device) {
      device.name = newName;
      await saveDevice(device);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error renaming device:', error);
    return false;
  }
};

// เปลี่ยนไอคอนอุปกรณ์
export const changeDeviceIcon = async (deviceId, newIcon) => {
  try {
    const device = await getDeviceById(deviceId);
    if (device) {
      device.icon = newIcon;
      await saveDevice(device);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error changing device icon:', error);
    return false;
  }
};

// ดึงรายการอุปกรณ์ตามประเภท
export const getDevicesByType = async (type) => {
  try {
    const devices = await getDevices();
    return devices.filter(device => device.type === type);
  } catch (error) {
    console.error('Error getting devices by type:', error);
    return [];
  }
};

// ดึงรายการอุปกรณ์ตามห้อง
export const getDevicesByRoom = async (room) => {
  try {
    const devices = await getDevices();
    return devices.filter(device => device.room === room);
  } catch (error) {
    console.error('Error getting devices by room:', error);
    return [];
  }
};

// ล้างข้อมูลอุปกรณ์ทั้งหมด (ใช้ในกรณีลงชื่อออกหรือรีเซ็ตแอป)
export const clearAllDevices = async () => {
  try {
    await AsyncStorage.removeItem('devices');
    return true;
  } catch (error) {
    console.error('Error clearing devices:', error);
    return false;
  }
};

// เพิ่มอุปกรณ์จาก Tuya API
export const importDevicesFromTuya = async (tuyaDevices) => {
  try {
    const devices = await getDevices();
    
    // กรองเฉพาะอุปกรณ์ที่ยังไม่มีในระบบ
    const newDevices = tuyaDevices.filter(tuyaDevice => 
      !devices.some(device => device.tuya_device_id === tuyaDevice.id)
    );
    
    // เพิ่มอุปกรณ์ใหม่
    for (const tuyaDevice of newDevices) {
      const newDevice = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // สร้าง ID ภายใน
        tuya_device_id: tuyaDevice.id,
        name: tuyaDevice.name,
        type: mapTuyaProductType(tuyaDevice.productId), // ฟังก์ชันแปลงประเภทสินค้าของ Tuya เป็นประเภทในแอป
        icon: getDefaultIcon(tuyaDevice.productId), // ฟังก์ชันให้ไอคอนเริ่มต้นตามประเภทสินค้า
        room: 'Default', // ห้องเริ่มต้น
        created_at: new Date().toISOString()
      };
      
      await saveDevice(newDevice);
    }
    
    return newDevices.length; // คืนค่าจำนวนอุปกรณ์ที่นำเข้า
  } catch (error) {
    console.error('Error importing Tuya devices:', error);
    return 0;
  }
};

// ฟังก์ชันสำหรับการตั้งค่าอุปกรณ์อัตโนมัติหลังจากการอัพเดต
export const setupDeviceAfterRegistration = async (deviceId, deviceInfo) => {
  try {
    const device = await getDeviceById(deviceId);
    if (device) {
      // อัปเดตข้อมูลอุปกรณ์เพิ่มเติมหลังจากลงทะเบียน
      device.name = deviceInfo.name || device.name;
      device.room = deviceInfo.room || device.room;
      device.icon = deviceInfo.icon || device.icon;
      device.registered_at = new Date().toISOString();
      
      await saveDevice(device);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting up device after registration:', error);
    return false;
  }
};

// ฟังก์ชันช่วยสำหรับแมป product ID ของ Tuya เป็นประเภทในแอป
const mapTuyaProductType = (productId) => {
  // นี่เป็นเพียงตัวอย่าง คุณควรเพิ่มการแมปตามประเภทสินค้าจริงของ Tuya
  const typeMap = {
    'abcd1234': 'air_quality',
    'efgh5678': 'light',
    // เพิ่มเติมตามที่จำเป็น
  };
  
  return typeMap[productId] || 'unknown';
};

// ฟังก์ชันช่วยสำหรับกำหนดไอคอนเริ่มต้นตามประเภทสินค้า
const getDefaultIcon = (productId) => {
  const deviceType = mapTuyaProductType(productId);
  
  const iconMap = {
    'air_quality': '🍃',
    'light': '💡',
    'plug': '🔌',
    'thermostat': '🌡️',
    'camera': '📹',
    'unknown': '📱'
  };
  
  return iconMap[deviceType] || '📱';
};