import 'react-native-get-random-values';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { TUYA_CONFIG } from '../config';

// API paths
const API_PATHS = {
  GET_TOKEN: '/v1.0/token?grant_type=1',
  PAIRING_TOKEN: '/v1.0/device/paring/token',
  POLL_PAIRING: '/v1.0/device/paring/tokens',
  USER_INFO: '/v2.0/apps/Arkad02141211/users',  
  DEVICE_TOKEN: '/v1.0/device/paring/tokens',
  WIFI_CONFIG: '/v1.0/devices/wifi/token/config' // อัพเดท path ตามเอกสาร Tuya
};

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const getTuyaToken = async () => {
  try {
   

    const method = 'GET';
    const path = API_PATHS.GET_TOKEN;
    const t = Date.now().toString();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = TUYA_CONFIG.apiKey + t + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, TUYA_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const response = await axios({
      method,
      url: `${TUYA_CONFIG.baseUrl}${path}`,
      headers: {
        'client_id': TUYA_CONFIG.apiKey,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    });


    return response.data;
  } catch (error) {
    console.error('Token Error:', error.response?.data || error.message);
    throw error;
  }
};

export const startPairing = async (accessToken, wifiConfig, mode) => {
  try {
   
    const nonce = uuidv4();

    const body = { 
      paring_type: mode,  // "EZ" หรือ "AP"
      uid: TUYA_CONFIG.uuid,
      time_zone_id: "Asia/Bangkok",
      home_id: "",
      extension: {
        ssid: wifiConfig.ssid,
        password: wifiConfig.password
      }
    };

    const method = 'POST';
    const path = API_PATHS.PAIRING_TOKEN;
    const t = Date.now().toString();

    const contentToSign = [
      method,
      CryptoJS.SHA256(JSON.stringify(body)).toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = TUYA_CONFIG.apiKey + accessToken + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, TUYA_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      "client_id": TUYA_CONFIG.apiKey,
      "sign": sign,
      "t": t,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
      "access_token": accessToken,
      "Content-Type": "application/json"
    };

    const response = await axios.post(
      `${TUYA_CONFIG.baseUrl}${path}`,
      body,
      { headers }
    );


    
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

export const getUserInfo = async (accessToken) => {
  try {
    
    const method = 'GET';
    const path = API_PATHS.USER_INFO;
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = TUYA_CONFIG.apiKey + accessToken + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, TUYA_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': TUYA_CONFIG.apiKey,
      'access_token': accessToken,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${TUYA_CONFIG.baseUrl}${path}`,
      headers
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user info:", error.response?.data || error.message);
    throw error;
  }
};

export const pollPairingResult = async (accessToken, token) => {
  try {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    if (!token) {
      throw new Error('Pairing token is required');
    }

    
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

    const stringToSign = TUYA_CONFIG.apiKey + accessToken + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, TUYA_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': TUYA_CONFIG.apiKey,
      'access_token': accessToken,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };


    const response = await axios({
      method,
      url: `${TUYA_CONFIG.baseUrl}${path}`,
      headers
    });

    return response.data;
  } catch (error) {
    // ปรับปรุงการจัดการ error
    const errorInfo = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      type: error.name
    };
    
    console.error("❌ Polling Error:", errorInfo);
    throw new Error(error.response?.data?.msg || error.message);
  }
};

export const getUserDevices = async (accessToken) => {
  try {    
    const method = 'GET';
    const path = '/v1.0/users/devices';
    const t = Date.now().toString();
    const nonce = uuidv4();

    const contentToSign = [
      method,
      CryptoJS.SHA256('').toString().toLowerCase(),
      '',
      path
    ].join('\n');

    const stringToSign = TUYA_CONFIG.apiKey + accessToken + t + nonce + contentToSign;
    const sign = CryptoJS.HmacSHA256(stringToSign, TUYA_CONFIG.apiSecret)
      .toString()
      .toUpperCase();

    const headers = {
      'client_id': TUYA_CONFIG.apiKey,
      'access_token': accessToken,
      'sign': sign,
      't': t,
      'nonce': nonce,
      'sign_method': 'HMAC-SHA256'
    };

    const response = await axios({
      method,
      url: `${TUYA_CONFIG.baseUrl}${path}`,
      headers
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching devices:", error.response?.data || error.message);
    throw error;
  }
};
