import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchDevicesetup } from '@/api/baseapi';
import { useTranslation } from 'react-i18next';


export default function DeviceLocation() {
  const params = useLocalSearchParams();
  console.log('rrr',params)
  const { productId,productModel, deviceCode,productName } = params;
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // ตัวอย่างห้องให้เลือก
  const suggestedLocations = [
    t('myhome.living_room'),
    t('myhome.bed_room'),
    t('myhome.kitchen'),
    t('myhome.bath_room'),
    t('myhome.office'),
    t('myhome.balcony')
  ];

  const handleConfirm = async () => {
    if (!location.trim()) {
      Alert.alert('กรุณาระบุชื่อห้องหรือสถานที่');
      return;
    }

    try {
      setIsLoading(true);

      // จำลองการส่งข้อมูลไปยัง API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetchDevicesetup(productId, productModel,deviceCode, location);

      console.log('Response:', response);

      if(response.success == true){
     router.push({
        pathname: '/device-scan/DeviceSuccess',
        params: {
          wifiName:productModel,
          deviceCode,
          location
        }
      });
      }else{
           
      Alert.alert(t('common.error'),t(response.message) );
      }
      // นำทางไปยังหน้าสำเร็จ


    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลงทะเบียนอุปกรณ์:', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLocation = (loc) => {
    setLocation(loc);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content"
                backgroundColor="#ffffff"
                translucent={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('myhome.Name_the_room')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.instruction}>
            {t('myhome.Name_a_room')} {productName} {t('myhome.easier_to_remember')}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('myhome.Specify_room')}
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.suggestedTitle}>{t('myhome.recommend')}:</Text>
          <View style={styles.suggestedLocations}>
            {suggestedLocations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationChip,
                  location === loc && styles.selectedLocationChip
                ]}
                onPress={() => selectLocation(loc)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    location === loc && styles.selectedLocationChipText
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !location.trim() && styles.disabledButton,
                isLoading && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={!location.trim() || isLoading}
            >
              {isLoading ? (
                <Text style={styles.confirmButtonText}>{t('myhome.Binding')}</Text>
              ) : (
                <Text style={styles.confirmButtonText}>{t('myhome.Confirm_devices')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
     marginTop: Platform.OS === 'ios' ? 35 : 34, // ปรับถ้าจำเป็น
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff'
  },
  keyboardAvoidView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  placeholder: {
    width: 40
  },
  content: {
    flex: 1,
    padding: 16
  },
  instruction: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 22
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 24
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  suggestedLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8
  },
  selectedLocationChip: {
    backgroundColor: '#2196f3'
  },
  locationChipText: {
    fontSize: 14,
    color: '#333'
  },
  selectedLocationChipText: {
    color: '#fff',
    fontWeight: '500'
  },
  footer: {
    marginTop: 20,
    paddingTop: 16
  },
  confirmButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});