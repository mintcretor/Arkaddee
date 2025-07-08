import { Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import * as Network from 'expo-network';
import * as Location from 'expo-location';

export const scanWiFiNetworks = async () => {
  try {
    // ขออนุญาตเข้าถึง Location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }
    const networkState = await Network.getNetworkStateAsync();


    if (Platform.OS === 'android') {
      const networks = await WifiManager.loadWifiList();
      
      // ใช้ Promise.all() เพื่อให้มั่นใจว่าทุก async จะเสร็จสิ้น
      const networkDetails = await Promise.all(networks.map(async network => {
        const networkState = await Network.getNetworkStateAsync();
        return {
          ssid: network.SSID,
          strength: network.level,
          isConnected: network.SSID === networkState.ssid
        };
      }));

      /*const networkDetails = [
        {
          ssid: "TMMPPP",
          strength: "Strong",
          isConnected: true,
          //type: Network.NetworkStateType.WIFI,
         // ipAddress: "192.168.1.4"
        }
        
      ];*/
      
      return networkDetails;
      
    } else {
      // iOS: return only current network
      const network = await Network.getNetworkStateAsync();
      return [{
        ssid: network.ssid || network.type,
        strength: 'Current Network',
        isConnected: true
      }];
    }
  } catch (error) {
    console.error('Error scanning WiFi:', error);
    throw error;
  }
};
