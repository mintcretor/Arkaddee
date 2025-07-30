// app/device-scan/edit-device-name.tsx (อัปเดตเวอร์ชัน)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Dimensions,
  ScrollView,
  Switch
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  updateDeviceName,
  updateRoomName,
  deleteDeviceFromAccount,
  setPrimaryDevice,
} from '@/api/baseapi';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function EditDeviceScreen() {
  const {
    deviceId,
    deviceName: initialDeviceName,
    roomName: initialRoomName,
    productId,
    is_primary: initialIsPrimary
  } = useLocalSearchParams<{
    deviceId: string,
    deviceName: string,
    roomName?: string,
    productId: string,
    is_primary?: string
  }>();
  console.log(initialIsPrimary)
  const [newDeviceName, setNewDeviceName] = useState(initialDeviceName || '');
  const [newRoomName, setNewRoomName] = useState(initialRoomName || '');
  const [isPrimaryDevice, setIsPrimaryDevice] = useState(initialIsPrimary === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('room'); // 'device' หรือ 'room'
  const { t } = useTranslation();

  useEffect(() => {
    setNewDeviceName(initialDeviceName || '');
    setNewRoomName(initialDeviceName || '');
    setIsPrimaryDevice(initialIsPrimary === 'true');
  }, [initialDeviceName, initialRoomName, initialIsPrimary]);

  // ฟังก์ชันสำหรับอัปเดตชื่ออุปกรณ์
  const handleSaveDeviceName = async () => {
    if (!newDeviceName.trim()) {
      Alert.alert(t('common.error'), t('myhome.device_name_cannot_be_empty'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateDeviceName(deviceId, newDeviceName.trim());

      if (response && response.success) {
        Alert.alert(
          t('common.success'),
          t('myhome.device_name_updated'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.message || t('myhome.failed_to_update_device_name'));
      }
    } catch (error) {
      console.error('Error updating device name:', error);
      Alert.alert(t('common.error'), error.message || t('myhome.error_updating_device_name_api'));
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับอัปเดตชื่อห้อง
  const handleSaveRoomName = async () => {
    if (!newRoomName.trim()) {
      Alert.alert(t('common.error'), t('myhome.roomeds'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateRoomName(deviceId, newRoomName.trim());

      if (response && response.success) {
        Alert.alert(
          t('common.success'),
          t('myhome.updateRoomSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error updating room name:', error);
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับตั้งค่าอุปกรณ์หลัก
  const handleSetPrimaryDevice = async (value: boolean) => {
    if (value) {
      Alert.alert(
        t('myhome.confirm_set_primary'),
        t('myhome.confirm_set_primary_message', { deviceName: initialDeviceName }),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.confirm'),
            onPress: async () => {
              setIsLoading(true);
              try {
                console.log(productId);
                const response = await setPrimaryDevice(deviceId, productId);
                if (response && response.success) {
                  setIsPrimaryDevice(true);
                  Alert.alert(
                    t('common.success'),
                    t('myhome.primary_device_set_successfully', { deviceName: initialDeviceName })
                  );
                } else {
                  Alert.alert(t('common.error'), response.message || t('myhome.failed_to_set_primary_device'));
                }
              } catch (error) {
                console.error('Error setting primary device:', error);
                Alert.alert(t('common.error'), error.message || t('myhome.error_setting_primary_device'));
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      // ไม่สามารถยกเลิกการเป็นอุปกรณ์หลักได้
      Alert.alert(
        t('common.info'),
        t('myhome.cannot_unset_primary_device'),
        [{ text: t('common.ok') }]
      );
      setIsPrimaryDevice(true); // คืนค่าเป็น true
    }
  };

  const handleDeleteDevice = async () => {
    // ตรวจสอบว่าเป็นอุปกรณ์หลักหรือไม่


    Alert.alert(
      t('myhome.confirm_delete_device'),
      t('myhome.confirm_delete_device_message', { deviceName: initialDeviceName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete_device'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const deleteResponse = await deleteDeviceFromAccount(deviceId);
              if (deleteResponse && deleteResponse.success) {
                Alert.alert(
                  t('common.success'),
                  t('myhome.device_deleted_successfully', { deviceName: initialDeviceName }),
                  [
                    {
                      text: t('common.ok'),
                      onPress: () => router.replace('/myhome')
                    }
                  ]
                );
              } else {
                Alert.alert(t('common.error'), t('myhome.failed_to_delete_device'));
              }
            } catch (error) {
              console.error('Error deleting device:', error);
              Alert.alert(t('common.error'), error.message || t('myhome.error_deleting_device_api'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  console.log(initialRoomName)
  const navigateToControl = () => {
    router.replace({
      pathname: '/device-scan/device-control',
      params: {
        deviceId: deviceId,
        productId: productId,
        deviceName: initialDeviceName,
        is_primary: String(initialIsPrimary ?? false)

      }

    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ImageBackground
        source={require('@/assets/images/image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('myhome.device_settings')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Tab Navigation */}


            {/* Room Name Tab */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('myhome.editroom')}</Text>
              <TextInput
                style={styles.input}
                value={newRoomName}
                onChangeText={setNewRoomName}
                placeholder={t('myhome.place_name_room')}
                placeholderTextColor="rgba(255,255,255,0.6)"
                maxLength={50}
              />
              <Text style={styles.helperText}>
                {newRoomName.length}/50 {t('myhome.character')}
              </Text>

            </View>


            {/* Primary Device Setting */}
            <View style={styles.card}>
              
              <View style={styles.primaryDeviceContainer}>
                <View style={styles.primaryDeviceInfo}>
                  <Text style={styles.primaryDeviceTitle}>{t('myhome.set_as_primary_device')}</Text>
                  <Text style={styles.primaryDeviceDescription}>
                    {t('myhome.primary_device_description')}
                  </Text>
                  {isPrimaryDevice && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>{t('myhome.current_primary_device')}</Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={isPrimaryDevice}
                  onValueChange={handleSetPrimaryDevice}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#2EE3DA' }}
                  thumbColor={isPrimaryDevice ? '#fff' : '#f4f3f4'}
                  disabled={isLoading}
                />
              </View>
            </View>

            {/* Device Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('myhome.device_mng')}</Text>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveRoomName}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('myhome.saver_room_name')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                ]}
                onPress={handleDeleteDevice}

              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[
                    styles.deleteButtonText,
                  ]}>
                    {t('common.delete_device')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2EE3DA" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: StatusBar.currentHeight || 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2EE3DA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2EE3DA',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  card: {
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  helperText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#2EE3DA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryDeviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryDeviceInfo: {
    flex: 1,
    marginRight: 15,
  },
  primaryDeviceTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  primaryDeviceDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBadge: {
    backgroundColor: '#2EE3DA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  primaryBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlButton: {
    backgroundColor: 'rgba(46, 227, 218, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2EE3DA',
  },
  controlButtonText: {
    color: '#2EE3DA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  deleteDisabledText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
});