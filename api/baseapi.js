// api/baseapi.js
import axios from 'axios';
import { BASEAPI_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: BASEAPI_CONFIG.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// สร้างฟังก์ชันสำหรับเรียกใช้ API
export const fetchRestaurants = async (params = {}) => {
  try {
    const response = await api.get('/restaurants', { params });
    return response.data;
  } catch (error) {
  //  console.error('Error fetching restaurants:', error);
    throw error;
  }
};

export const fetchAirRestaurantById = async (id) => {
  try {
    const response = await api.get(`/air-quality/store/${id}`);
    return response.data;
  } catch (error) {
    //console.error(`Error fetching restaurant ${id}:`, error);
    throw error;
  }
};

export const fetchCheckPassword = async (devicetype, password) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post('/device/check-password', { devicetype, password }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking password:', error);
    throw error;
  }
};
export const fetchDevicesetup = async (deviceid,device_type,deviceCode, location) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post('/device/devicesetup', { deviceid,device_type, deviceCode,location }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking device:', error);
    throw error;
  }
};

export const setPrimaryDevice = async (deviceid,device_type) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post('/device/devicesetupprimary', { deviceid,device_type }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking device:', error);
    throw error;
  }
};

export const fetchRestaurantByTypeId = async (id, latitude = null, longitude = null, filter = 0) => {
  try {

    // สร้าง params object สำหรับ query parameters
    const params = {};

    // เพิ่ม latitude และ longitude ถ้ามีค่า
    if (latitude !== null && longitude !== null) {
      params.latitude = latitude;
      params.longitude = longitude;
    }

    // เพิ่ม filter ถ้าไม่ใช่ 'all'
    if (filter && filter !== 'all') {
      params.filter = filter;
    }

    // เรียกใช้ API พร้อมกับ params
    const response = await api.get(`/stores/type/${id}`, { params });
    return response.data;
  } catch (error) {
    //console.error(`Error fetching restaurants for type ${id}:`, error);
    throw error;
  }
};

// แก้ไข fetchRestaurantById ให้รองรับ token (optional)
export const fetchRestaurantById = async (id) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    // สร้าง headers object
    const response = await api.get(`/stores/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
   // console.error(`Error fetching restaurant ${id}:`, error);

    // จัดการ error ให้ดีขึ้น
    if (error.response?.status === 404) {
      throw new Error('ไม่พบร้านค้าที่ระบุ');
    } else if (error.response?.status === 401) {
      // Token หมดอายุ - ลบ token ออก
      console.log('Token expired, removing token');
      //await AsyncStorage.removeItem('userToken');
    }

    throw error;
  }
};

// เพิ่มฟังก์ชันสำหรับระบบ Favorite
export const addFavorite = async (storeId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    const response = await api.post(`/stores/${storeId}/favorite`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);

    if (error.response?.status === 401) {
      //await AsyncStorage.removeItem('userToken');
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    } else if (error.response?.status === 409) {
      throw new Error('คุณได้เพิ่มร้านนี้เป็นรายการโปรดไปแล้ว');
    } else if (error.response?.status === 404) {
      throw new Error('ไม่พบร้านค้าที่ระบุ');
    }

    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มร้านโปรด');
  }
};

export const removeFavorite = async (storeId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    const response = await api.delete(`/stores/favorite/${storeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error removing favorite:', error);

    if (error.response?.status === 401) {
      //await AsyncStorage.removeItem('userToken');
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    } else if (error.response?.status === 404) {
      throw new Error('ไม่พบร้านนี้ในรายการโปรดของคุณ');
    }

    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบร้านโปรด');
  }
};

// ตรวจสอบสถานะ favorite
export const checkFavoriteStatus = async (storeId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await api.get(`/stores/${storeId}/favorite/status`, {
      headers
    });

    return response.data;
  } catch (error) {
    console.error('Error checking favorite status:', error);

    // ถ้า error ให้ return false เป็น default
    return {
      status: 'success',
      data: {
        is_favorite: false
      }
    };
  }
};

// ดึงรายการร้านโปรดของผู้ใช้
export const getUserFavorites = async (page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนดูรายการโปรด');
    }

    // ✅ วิธีที่ 1: ใช้ POST และส่ง params ใน body (ถ้า API ต้องการแบบนี้)
    const response = await api.post('/users/favorites',
      { page, limit }, // data ที่ส่งใน body
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // ✅ วิธีที่ 2: ใช้ GET และส่ง params ใน query string (แนะนำ)
    // const response = await api.get('/users/favorites', {
    //   params: { page, limit },
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // });

    //console.log('User favorites response:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error getting user favorites:', error.response || error);

    if (error.response?.status === 401) {
      // await AsyncStorage.removeItem('userToken');
      throw new Error('กรุณาเข้าสู่ระบบใหม่');
    }

    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงรายการโปรด');
  }
};


// ฟังก์ชัน toggle favorite (สำหรับความสะดวก)
export const toggleFavorite = async (storeId, isFavorite) => {
  try {
    if (isFavorite) {
      return await removeFavorite(storeId);
    } else {
      return await addFavorite(storeId);
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const fetchNearbyRestaurants = async (lat, lng, maxDistance = 2000) => {

  try {
    const response = await api.get('/stores/nearby', {
      params: {
        latitude: lat,
        longitude: lng,
        radius: maxDistance
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    throw error;
  }
};


export const fetchPlaces = async () => {
  try {
    const response = await api.get('/places');
    return response.data;
  } catch (error) {
    //console.error('Error fetching places:', error);
    throw error;
  }
};

export const fetchAqiThai = async () => {
  try {
    const response = await api.get('/dustboy');
    return response.data;
  } catch (error) {
    //console.error('Error fetching places:', error);
    throw error;
  }
};

export const fetchAqiArkad = async () => {
  try {
    const response = await api.get('/stores');
    return response.data;
  } catch (error) {
    //console.error('Error fetching places:', error);
    throw error;
  }
};

// ฟังก์ชันใหม่: ดึงเฉพาะจุดที่มีค่า PM2.5 สูง
export const fetchHighPM25Stations = async (limit = 50) => {
  try {
    const response = await api.get(`/dustboy/highpm25`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching high PM2.5 stations:', error);
    throw error;
  }
};

// ฟังก์ชันใหม่: ดึงตามพื้นที่ (ระบุพิกัดกลางและรัศมี)
export const fetchStationsByArea = async (lat, lng, radius = 50) => {
  try {
    const response = await api.get(`/dustboy/area`, {
      params: { lat, lng, radius }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stations by area:', error);
    throw error;
  }
};

// ฟังก์ชันใหม่: ดึงข้อมูลเฉพาะสถานีที่ระบุ
export const fetchStationDetails = async (stationId) => {
  try {
    const response = await api.get(`/dustboy/station/${stationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching station details:', error);
    throw error;
  }
};

// ฟังก์ชันใหม่: ดึงข้อมูลแบบย่อ
export const fetchSimplifiedStations = async () => {
  try {
    const response = await api.get(`/dustboy/simplified`);
    return response.data;
  } catch (error) {
    console.error('Error fetching simplified stations:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.put('/users/profile', userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// เพิ่มฟังก์ชันสำหรับอัพโหลดรูปโปรไฟล์
// เพิ่มฟังก์ชันสำหรับอัพโหลดรูปโปรไฟล์
export const uploadProfileImage = async (imageUri) => {
  try {
    // ดึงนามสกุลไฟล์จาก uri
    const token = await AsyncStorage.getItem('userToken');

    console.log("Token for upload:", token ? token.substring(0, 10) + '...' : 'No token');
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1];

    // สร้าง FormData สำหรับอัพโหลดรูป
    const formData = new FormData();
    formData.append('profile', {
      uri: imageUri,
      name: `profile-${Date.now()}.${fileExtension}`,
      type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
    });

    // สร้าง instance axios ใหม่สำหรับการอัพโหลดไฟล์
    const uploadConfig = {
      method: 'post',
      url: `${BASEAPI_CONFIG.baseUrl}/upload/profile`,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      data: formData
    };

    const response = await axios(uploadConfig);
    return response.data;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data?.message || 'ไม่สามารถอัพโหลดรูปโปรไฟล์ได้'
      };
    }
    return { status: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
  }
};



export const fetchDeviceAccount = async (id) => {
  try {
   // console.log('Fetching device account');
    const token = await AsyncStorage.getItem('userToken');

    // If id is meant to be a query parameter
    const response = await api.get(`/users/device`, {
      params: id ? { id: id } : undefined,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    //console.log('Device account response:', response.data);

    return response.data;
  } catch (error) {
    //console.error('Error Device Not Found:', error);
    throw error;
  }
};

export const fetchDevicePrimary = async (id) => {
  try {
   // console.log('Fetching device account');
    const token = await AsyncStorage.getItem('userToken');

    // If id is meant to be a query parameter
    const response = await api.get(`/users/devicePrimary`, {
      params: id ? { id: id } : undefined,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    //console.log('Device account response:', response.data);

    return response.data;
  } catch (error) {
    //console.error('Error Device Not Found:', error);
    throw error;
  }
};

export const updateDeviceName = async (deviceId, deviceName) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    const response = await api.put(`/device/${deviceId}/name`, 
      { deviceName }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating device name:', error);
    
    if (error.response?.status === 401) {
      throw new Error('กรุณาเข้าสู่ระบบใหม่');
    } else if (error.response?.status === 404) {
      throw new Error('ไม่พบอุปกรณ์หรือไม่มีสิทธิ์แก้ไข');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'ข้อมูลไม่ถูกต้อง');
    }
    
    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตชื่ออุปกรณ์');
  }
};

// อัปเดตชื่อห้อง
export const updateRoomName = async (deviceId, roomName) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    const response = await api.put(`/device/${deviceId}/room`, 
      { roomName }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating room name:', error);
    
    if (error.response?.status === 401) {
      throw new Error('กรุณาเข้าสู่ระบบใหม่');
    } else if (error.response?.status === 404) {
      throw new Error('ไม่พบอุปกรณ์หรือไม่มีสิทธิ์แก้ไข');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'ข้อมูลไม่ถูกต้อง');
    }
    
    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตชื่อห้อง');
  }
};


export const deleteDeviceFromAccount = async (id) => {
  try {
   // console.log('Fetching device account');
    const token = await AsyncStorage.getItem('userToken');

    // If id is meant to be a query parameter
    const response = await api.delete(`/users/device/${id}`, {
      params: id ? { id: id } : undefined,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    //console.log('Device account response:', response.data);

    return response.data;
  } catch (error) {
   console.error('Error Device Not Found:', error);
    throw error;
  }
};
export const fetchDeviceId = async (devicetype, deviceid) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post('/device/getDevice', { devicetype, deviceid }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking password:', error);
    throw error;
  }
};


export const updateDeviceStatus = async (devicetype, deviceId, statusData) => {
  try {
    // รับ token จาก AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      throw new Error('No authentication token found');
    }

    // สร้างข้อมูลที่จะส่ง - ส่งเป็น flat object แทน nested object
    const requestData = {
      devicetype,
      deviceId,
      ...statusData // แยกค่าจาก statusData แทนที่จะส่งเป็น nested
    };

    console.log('Sending to API:', requestData);

    // ส่งคำขอไปยัง API
    const response = await api.post('/device/status', requestData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // ตรวจสอบการตอบกลับ
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update device status');
    }
  } catch (error) {
    console.error('Error updating device status:', error);
    throw error;
  }
};



export default api;