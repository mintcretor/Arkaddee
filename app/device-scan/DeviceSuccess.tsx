import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DeviceSuccess() {
  const params = useLocalSearchParams();
  const { wifiName, location } = params;
  const { t } = useTranslation();

  const handleFinish = () => {
    // กลับไปหน้าหลัก หรือไปยังหน้าควบคุมอุปกรณ์
    router.push('/myhome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content"
                backgroundColor="#ffffff"
                translucent={true} />
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.successTitle}>{t('myhome.registration_successful')}</Text>
        
        <View style={styles.deviceInfoContainer}>
          <Text style={styles.deviceInfoLabel}>{t('myhome.Devicename')} :</Text>
          <Text style={styles.deviceInfoValue}>{wifiName}</Text>
          
          <Text style={styles.deviceInfoLabel}>{t('myhome.location')}:</Text>
          <Text style={styles.deviceInfoValue}>{location}</Text>
        </View>
        
        <Text style={styles.successDescription}>
          {t('myhome.notices')}
        </Text>
        
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>{t('myhome.done')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'ios' ? 35 : 34, // ปรับถ้าจำเป็น
    
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIconContainer: {
    marginBottom: 24
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center'
  },
  deviceInfoContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  deviceInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 16
  },
  successDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32
  },
  finishButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center'
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});