// TuyaService.js
import 'react-native-get-random-values';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tuya API configuration
const API_CONFIG = {
  apiKey: 'mxud4dr4knnt83e3yh54',
  apiSecret: '8d27965e7bdd4349ab0b13b4440b964f',
  baseUrl: 'https://openapi.tuyaus.com',
  uuid: uuidv4() // สร้าง unique identifier
};

// Cache token
let cachedToken = null;
let tokenExpiry = 0;

// Get Tuya Access Token
export const getToken = async () => {
  try {
   // console.log('Getting Tuya token...');

    // ตรวจสอบ token ในแคช
    if (cachedToken && tokenExpiry > Date.now()) {
      return cachedToken;
    }

    const method = 'GET';
    const path = '/v1.0/token?grant_type=1';
    const t = Date.now().toString();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + t + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${path}`,
      headers: {
        'client_id': API_CONFIG.apiKey,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    });

    if (response.data && response.data.success) {
      cachedToken = response.data.result.access_token;
      const expiresIn = response.data.result.expire_time || 7200;
      tokenExpiry = Date.now() + (expiresIn - 60) * 1000;
      
      await AsyncStorage.setItem('tuya_token', cachedToken);
      await AsyncStorage.setItem('tuya_token_expiry', tokenExpiry.toString());
      
      console.log('Token obtained successfully');
      return cachedToken;
    } else {
      throw new Error('Failed to get token: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('Error getting token:', error.response?.data || error.message);
    throw error;
  }
};

// Get device status
export const getDeviceStatus = async (deviceId) => {
  try {
    const token = await getToken();
    const method = 'GET';
    const path = `/v1.0/devices/${deviceId}/status`;
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + token + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': API_CONFIG.apiKey,
      'access_token': token,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${path}`,
      headers
    });

    if (!response.data || !response.data.success) {
      throw new Error('Failed to get device status: ' + JSON.stringify(response.data));
    }

    return response.data.result;
  } catch (error) {
    console.error(`Error getting status for device ${deviceId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Control device - send commands
export const controlDevice = async (deviceId, commands) => {
  try {
    const token = await getToken();
    const method = 'POST';
    const path = `/v1.0/devices/${deviceId}/commands`; 
    const t = Date.now().toString();
    const nonce = uuidv4();
    
    // ตรวจสอบและปรับรูปแบบคำสั่งให้ถูกต้องเสมอ
    const body = {
      commands: Array.isArray(commands) ? commands : 
               (Array.isArray(commands.commands) ? commands.commands : [commands])
    };
    
    
    console.log('Sending command body:', JSON.stringify(body, null, 2));

    const contentToSign = [
      method,
      CryptoJS.SHA256(JSON.stringify(body)).toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + token + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': API_CONFIG.apiKey,
      'access_token': token,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256',
      'Content-Type': 'application/json'
    };

    const response = await axios.post(
      `${API_CONFIG.baseUrl}${path}`,
      body,
      { headers }
    );
    
    console.log('ผลการส่งคำสั่ง:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error controlling device:', error.response?.data || error.message);
    throw error;
  }
};

// Get device info
export const getDeviceInfo = async (deviceId) => {
  try {
    const token = await getToken();
    const method = 'GET';
    const path = `/v1.0/devices/${deviceId}`;
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + token + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': API_CONFIG.apiKey,
      'access_token': token,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${path}`,
      headers
    });

    return response.data;
  } catch (error) {
    console.error('Error getting device info:', error.response?.data || error.message);
    throw error;
  }
};

// Get user devices - ดึงรายการอุปกรณ์ทั้งหมดของผู้ใช้
export const getUserDevices = async () => {
  try {
    console.log("🔍 Checking devices in project...");
    
    const token = await getToken();
    const method = 'GET';
    
    // เพิ่มพารามิเตอร์ page_size ที่จำเป็น
    // จากเอกสาร API ค่าสูงสุดคือ 20
    const path = '/v2.0/cloud/thing/device?page_size=20';
    
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + token + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': API_CONFIG.apiKey,
      'access_token': token,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${path}`,
      headers
    });

    console.log("✅ Device List Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching devices:", error.response?.data || error.message);
    throw error;
  }
};

// Start device discovery/pairing
export const startPairing = async (wifiConfig, mode = 'AP') => {
  try {
    console.log("🔹 Starting device pairing...", { mode });
    const token = await getToken();
    const nonce = uuidv4();

    // ตามเอกสาร API ใหม่
    const path = '/v2.0/cloud/thing/active/qrcode';

    // ปรับรูปแบบข้อมูลตามเอกสาร API
    const body = {
      device_num: 1,
      time_zone: "+07:00", // For Asia/Bangkok
      qrcode_info: {
        token_validity_period: 1800, // 30 minutes
        product_id: wifiConfig.productId || "", // This may be required
        pairing_type: mode.toUpperCase(), // "AP" or "EZ"
        ssid: wifiConfig.ssid,
        password: wifiConfig.password,
        region_code: "US" // Default region code, adjust if needed
      }
    };

    const method = 'POST';
    const t = Date.now().toString();

    const contentToSign = [
      method,
      CryptoJS.SHA256(JSON.stringify(body)).toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + token + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      "client_id": API_CONFIG.apiKey,
      "sign": sign,
      "t": t,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
      "access_token": token,
      "Content-Type": "application/json"
    };

    console.log('Pairing Request:', {
      url: `${API_CONFIG.baseUrl}${path}`,
      method,
      mode,
      ssid: wifiConfig.ssid
    });

    const response = await axios.post(
      `${API_CONFIG.baseUrl}${path}`,
      body,
      { headers }
    );

    console.log("✅ Pairing Response:", response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.msg || 'Pairing initialization failed');
    }

    return response.data;
  } catch (error) {
    console.error("❌ Pairing Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};
// Poll for pairing result
export const pollPairingResult = async (token) => {
  try {
    const accessToken = await getToken();
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    if (!token) {
      throw new Error('Pairing token is required');
    }

    console.log("🔹 Polling pairing result for token:", token);
    
    const method = 'GET';
    const path = `/v1.0/device/paring/tokens/${token}`;
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = API_CONFIG.apiKey + accessToken + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, API_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': API_CONFIG.apiKey,
      'access_token': accessToken,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${path}`,
      headers
    });

    console.log("✅ Polling Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Polling Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Specialized functions for air purifier
export const getAirPurifierStatus = async (deviceId) => {
  try {
    const statusData = await getDeviceStatus(deviceId);
    
    // Transform the response to match your UI model
    const airQualityData = {
      power: false,
      mode: 'auto',
      pm25: 0,
      eco2: 0,
      tvoc: 0,
      humidity: 0,
      temperature: 0,
      filterLife: 100
    };
    
    // แปลงข้อมูลตาม code ที่ได้จากอุปกรณ์จริง
    statusData.forEach(item => {
      if (item.code === 'pm25_value' || item.code === 'pm25') {
        airQualityData.pm25 = parseFloat(item.value);
      }
      else if (item.code === 'temp_current' || item.code === 'temp_indoor') {
        airQualityData.temperature = parseFloat(item.value);
      }
      else if (item.code === 'humidity_value' || item.code === 'humidity_indoor') {
        airQualityData.humidity = parseFloat(item.value);
      }
      else if (item.code === 'tvoc_value' || item.code === 'tvoc') {
        airQualityData.tvoc = parseFloat(item.value);
      }
      else if (item.code === 'co2_value' || item.code === 'eco2') {
        airQualityData.eco2 = parseFloat(item.value);
      }
      else if (item.code === 'filter_life') {
        airQualityData.filterLife = parseFloat(item.value);
      }
      else if (item.code === 'switch') {
        airQualityData.power = item.value;
      }
      else if (item.code === 'mode') {
        airQualityData.mode = item.value;
      }
    });
    
    return airQualityData;
  } catch (error) {
    console.error('Error getting air purifier status:', error);
    throw error;
  }
};

// Turn air purifier on/off
export const toggleAirPurifier = async (deviceId, turnOn) => {
  const command = {
    code: 'switch',
    value: turnOn
  };
  
  return await controlDevice(deviceId, command);
};

// Set air purifier mode
export const setAirPurifierMode = async (deviceId, mode) => {
  const command = {
    code: 'mode',
    value: mode // 'auto', 'sleep', 'manual' ขึ้นอยู่กับที่อุปกรณ์รองรับ
  };
  
  return await controlDevice(deviceId, command);
};

// Set fan speed if supported
export const setFanSpeed = async (deviceId, speed) => {
  const command = {
    code: 'SupplyFanSpeed',
    value: speed
  };
  
  return await controlDevice(deviceId, command);
};

// Reset filter life
export const resetFilterLife = async (deviceId) => {
  const command = {
    code: 'filter_reset',
    value: true
  };
  
  return await controlDevice(deviceId, command);
};

// Discover devices - ค้นหาอุปกรณ์ในโหมดจับคู่
export const discoverDevices = async () => {
  try {
    // ดึงรายการอุปกรณ์ที่จับคู่แล้ว
    const response = await getUserDevices();
    if (response && response.success && response.result) {
      //console.log(response.result)
      return response.result;
    }
    return [];
  } catch (error) {
    console.error('Error discovering devices:', error);
    return [];
  }
};


