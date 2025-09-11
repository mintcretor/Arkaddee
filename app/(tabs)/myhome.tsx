// app/arkad-dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Platform,
  Image,
  FlatList,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import Header from '@/components/Header';
import { router, useFocusEffect } from 'expo-router';
import { fetchDeviceAccount, fetchDevicePrimary } from '@/api/baseapi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

// Device Interface
interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  icon: string;
  is_primary: boolean,
  productId: string;
  data: {
    temperature?: number;
    humidity?: number;
    co2?: number;
    pm25?: number;
  };
}

// Interface for primary device data
interface PrimaryDeviceData {
  room_name?: string;
  pm25: number;
  temperature: number;
  humidity: number;
  co2: number;
}

// Helper function to handle temperature conversion
const convertTemperature = (temp: number) => {
  if (temp >= 100 && temp < 1000) {
    return temp / 10;
  }
  return temp;
};
const HEADER_HEIGHT = 50;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const TOP_SPACING = Platform.OS === 'ios' ? 0 : 0;
export default function ArkadDashboard() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState<string | React.ReactNode>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [primaryDeviceData, setPrimaryDeviceData] = useState<PrimaryDeviceData>({
    pm25: 0,
    temperature: 0,
    humidity: 0,
    co2: 0,
    room_name: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const isGuest = user?.authType === 'guest';

  const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}`);

    const days = [t('store.sunday'), t('store.monday'), t('store.tuesday'), t('store.wednesday'), t('store.thursday'), t('store.friday'), t('store.saturday')];
    const months = [t('myhome.JANUARY'), t('myhome.FEBRUARY'), t('myhome.MARCH'), t('myhome.APRIL'), t('myhome.MAY'), t('myhome.JUNE'), t('myhome.JULY'), t('myhome.AUGUST'), t('myhome.SEPTEMBER'), t('myhome.OCTOBER'), t('myhome.NOVEMBER'), t('myhome.DECEMBER')];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    if (i18n.language == "th") {
      setCurrentDate(`${dayName}ที่ ${date} ${monthName} ${now.getFullYear() + 543}`);
    } else {
      setCurrentDate(`${dayName} ${date} ${monthName} ${now.getFullYear()}`);
    }
  };

  const getAirQualityText = (pm25: number) => {
    if (pm25 <= 12) return t('myhome.Excellent');
    if (pm25 <= 35.4) return t('myhome.GOOD');
    if (pm25 <= 55.4) return t('myhome.MODERATE');
    if (pm25 <= 150.4) return t('myhome.POOR');
    if (pm25 <= 250.4) return t('myhome.VERYPOOR');
    return t('myhome.HAZARDOUS');
  };

  const getAirQualityColor = (pm25: number) => {
    if (pm25 <= 12) return '#4ADE80';
    if (pm25 <= 35.4) return '#22C55E';
    if (pm25 <= 55.4) return '#FBBF24';
    if (pm25 <= 150.4) return '#F97316';
    if (pm25 <= 250.4) return '#EF4444';
    return '#7F1D1D';
  };

  const imageDevice = (device_type: string) => {
    if (device_type === 'Arkad_HM') return require('@/assets/images/device/Arkad_HM.png');
    if (device_type === 'Arkad_M&C') return require('@/assets/images/device/Arkad_MC.png');
    if (device_type === 'Arkad_OS') return require('@/assets/images/device/Arkad_OS.png');
    if (device_type === 'Arkad_PBM') return require('@/assets/images/device/Arkad_PBM.png');
    if (device_type === 'Arkad_PBM-001') return require('@/assets/images/device/Arkad_PBM.png');
    if (device_type === 'Arkad_PCM') return require('@/assets/images/device/Arkad_PCM.png');
    return require('@/assets/images/device/Arkad_WM.png');
  };

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);

      const responsePrimary = await fetchDevicePrimary();
      if (responsePrimary.user.length > 0) {
        const firstDevice = responsePrimary.user[0];
        setPrimaryDeviceData({
          pm25: firstDevice.pm25,
          temperature: convertTemperature(firstDevice.temperature),
          humidity: firstDevice.humidity,
          co2: firstDevice.co2,
          room_name: firstDevice.room_name
        });
      } else {
        setPrimaryDeviceData({
          pm25: 0,
          temperature: 0,
          humidity: 0,
          co2: 0,
          room_name: undefined
        });
      }

      const response = await fetchDeviceAccount();
      if (response && response.success && response.user) {
        const discoveredDevices = response.user;
        const updatedDevices: Device[] = discoveredDevices.map((device: any) => {
          const deviceStatus = device.pwr == 0 ? 'offline' : 'online';
          const temp = convertTemperature(device.temperature);

          return {
            id: device.device_id,
            name: device.room_name,
            productId: device.device_type,
            type: 'air_quality',
            status: deviceStatus,
            is_primary: device.is_primary,
            icon: imageDevice(device.device_type),
            data: {
              temperature: temp,
              humidity: device.humidity,
              co2: device.co2,
              pm25: device.pm25
            }
          };
        });
        setDevices(updatedDevices);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      Alert.alert(t('common.error'), t('myhome.failed_to_load_devices_and_connect_server'));
      setPrimaryDeviceData({ pm25: 0, temperature: 0, humidity: 0, co2: 0 });
      setDevices([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (refreshUser) refreshUser();
      loadDevices();
    }, [])
  );

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        item.status === 'online' ? styles.deviceCardOnline : styles.deviceCardOffline
      ]}
      onPress={() => router.push({
        pathname: '/device-scan/device-control',
        params: {
          deviceId: item.id,
          productId: item.productId,
          deviceName: item.name,
          is_primary: String(item.is_primary ?? false),
        }
      })}
      activeOpacity={0.75}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.metricItem}>
          <Image
            source={item.icon}
            style={{ width: 80, height: 80, resizeMode: 'contain' }}
          />
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <View style={styles.pmDisplayOuter1}>
            <View style={styles.pmDisplayInner1}>
              <Text style={styles.pmValue1}>{item.data.pm25}</Text>
              <Text style={styles.pmUnit1}>μg/m³</Text>
            </View>
            <View style={styles.pmRing1} />
          </View>
        </View>
        <View style={styles.metricItem2}>
          <Text style={[styles.deviceName2, item.status === 'online' ? styles.statusOnline : styles.statusOffline]}>
            {item.status === 'online' ? t('myhome.online') : t('myhome.offline')}
          </Text>
        </View>
      </View>
      {item.type === 'air_quality' && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.data.temperature}°</Text>
            <Text style={styles.metricLabel}>TEMP</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.data.humidity}%</Text>
            <Text style={styles.metricLabel}>HUMIDITY</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.data.co2}</Text>
            <Text style={styles.metricLabel}>CO₂</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      {/* Main Air Quality Display */}
      <View style={styles.mainDisplay}>
        <View style={styles.pmDisplayContainer}>
          <View style={styles.pmDisplayOuter}>
            <View style={styles.pmDisplayInner}>
              <Text style={styles.pmValue}>{primaryDeviceData.pm25}</Text>
              <Text style={styles.pmUnit}>μg/m³</Text>
            </View>
            <View style={styles.pmRing} />
          </View>
          <Text style={[styles.airQualityStatus, { color: getAirQualityColor(primaryDeviceData.pm25) }]}>
            {getAirQualityText(primaryDeviceData.pm25)}
          </Text>
          <Text style={[styles.airQualityRoom]}>
            {primaryDeviceData.room_name}
          </Text>
        </View>
      </View>

      {/* Metrics Panel */}
      <View style={styles.metricsPanel}>
        <View style={styles.metricsPanelItem}>
          <View style={styles.metricsPanelIcon}>
            <Text style={styles.metricIconText}>🌡️</Text>
          </View>
          <View style={styles.metricsPanelData}>
            <Text style={styles.metricsPanelValue}>{primaryDeviceData.temperature}°C</Text>
            <Text style={styles.metricsPanelLabel}>{t('myhome.temperature')}</Text>
          </View>
        </View>
        <View style={styles.metricsPanelItem}>
          <View style={styles.metricsPanelIcon}>
            <Text style={styles.metricIconText}>💧</Text>
          </View>
          <View style={styles.metricsPanelData}>
            <Text style={styles.metricsPanelValue}>{primaryDeviceData.humidity}%</Text>
            <Text style={styles.metricsPanelLabel}>{t('myhome.humidity')}</Text>
          </View>
        </View>
        <View style={styles.metricsPanelItem}>
          <View style={styles.metricsPanelIcon}>
            <Text style={styles.metricIconText}>☁️</Text>
          </View>
          <View style={styles.metricsPanelData}>
            <Text style={styles.metricsPanelValue}>{primaryDeviceData.co2}</Text>
            <Text style={styles.metricLabel}>CO₂ (PPM)</Text>
          </View>
        </View>
      </View>

      {/* Time Panel */}
      <View style={styles.timePanel}>
        <Text style={styles.currentTime}>{currentTime}</Text>
        <Text style={styles.currentDate}>{currentDate}</Text>
      </View>

      {/* Section Header */}
      <View style={styles.devicesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('myhome.My_devices')}</Text>
        </View>
        {devices.length === 0 && !isLoading && (
          <View style={styles.emptyDevicesContainer}>
            <Text style={styles.emptyDevicesText}>
              {t('myhome.you_do_not_have_any_device_yet')}
            </Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <ImageBackground
        source={require('@/assets/images/image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <Header />
        <SafeAreaView style={styles.overlay}>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            ListHeaderComponent={renderHeader()}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addDeviceButton}
                onPress={() => {
                  if (!user || user.authType === 'guest') {
                    Alert.alert(
                      t('common.guestTitle'),
                      t('common.guestMyhome'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.signup'), onPress: () => router.push('/(auth)/register') }
                      ]
                    );
                    return;
                  }
                  router.push('/device-scan/HomeWifi');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.addButtonIcon}>
                  <Text style={styles.addButtonPlus}>+</Text>
                </View>
                <Text style={styles.addButtonText}>{t('myhome.Add_new_device')}</Text>
              </TouchableOpacity>
            }
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadDevices}
                colors={['#2EE3DA']}
                tintColor="#2EE3DA"
              />
            }
          />
        </SafeAreaView>
      </ImageBackground>

      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2EE3DA" />
          <Text style={styles.loadingText}>{t('myhome.Loading_device')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  settingsIcon: {
    fontSize: 16,
    color: 'white'
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'ios' ? 40 : 0, // ปรับถ้าจำเป็น
  },
  background: {
    flex: 1,

  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 40,
  },
  mainDisplay: {
    alignItems: 'center',
    marginTop: 10,
  },
  pmDisplayContainer: {
    alignItems: 'center',
  },
  pmDisplayOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pmDisplayInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2EE3DA',
    zIndex: 2,
  },
  pmRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: 'rgba(46, 227, 218, 0.3)',
    zIndex: 1,
  },
  pmDisplayOuter1: {
    width: 40,
    height: 40,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pmDisplayInner1: {
    width: 40,
    height: 40,
    borderRadius: 65,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2EE3DA',
    zIndex: 2,
  },
  pmRing1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(46, 227, 218, 0.3)',
    zIndex: 1,
  },
  pmValue1: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  pmUnit1: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -5,
  },
  pmValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  pmUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -5,
  },
  airQualityStatus: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
    letterSpacing: 2,
  },
  airQualityRoom: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffff',
    letterSpacing: 2,
  },
  airQualityLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    letterSpacing: 1,
  },
  metricsPanel: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  metricsPanelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricsPanelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 227, 218, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricIconText: {
    fontSize: 18,
  },
  metricsPanelData: {
    flex: 1,
  },
  metricsPanelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  metricsPanelLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  timePanel: {
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  currentDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: 1,
  },
  devicesSection: {
    marginTop: 16,
    minHeight: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  viewAllButton: {
    padding: 6,
  },
  viewAllText: {
    fontSize: 10,
    color: '#2EE3DA',
    letterSpacing: 0.5,
  },
  devicesList: {
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 160,
  },
  deviceCard: {
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: 16,
    marginBottom: 20,
    marginRight: 20,
    marginLeft: 20,
    padding: 16,
    borderWidth: 1,
    height: 170,
  },
  deviceCardOnline: {
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  deviceCardOffline: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    fontSize: 24,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusOnline: {
    color: 'green',
  },
  statusOffline: {
    color: 'red',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#fff',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  deviceName2: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricItem2: {
    flex: 1,
    alignItems: 'center',
    top: 0,
    marginBottom: 50
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  metricLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2EE3DA',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addButtonPlus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginTop: -2,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  emptyDevicesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 20,
    paddingBottom: 0
  },
  emptyDevicesText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});