import { Platform, PermissionsAndroid, Linking } from "react-native";

/**
 * ขอสิทธิ์ใช้งาน Location (จำเป็นสำหรับ Android)
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location to manage WiFi settings.",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
}

/**
 * เปิดหน้าการตั้งค่า Wi-Fi ให้ผู้ใช้เลือกเครือข่ายเอง
 */
export function openWiFiSettings(): void {
  if (Platform.OS === "ios") {
    Linking.openURL("App-Prefs:root=WIFI"); // เปิด Wi-Fi Settings บน iOS
  } else {
    Linking.sendIntent("android.settings.WIFI_SETTINGS"); // เปิด Wi-Fi Settings บน Android
  }
}

/**
 * ฟังก์ชันขอสิทธิ์และเปิด WiFi Settings ให้ผู้ใช้เลือกเอง
 */
export async function scanAndConnectWifi(): Promise<void> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission not granted");
    }

    // เปิดหน้าตั้งค่า Wi-Fi
    openWiFiSettings();
  } catch (error) {
    console.error("Error opening WiFi settings:", error);
    throw error;
  }
}
