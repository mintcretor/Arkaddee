import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fetchCheckPassword } from '@/api/baseapi';

export default function HomeProduct() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceCodeError, setDeviceCodeError] = useState('');
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!showModal) {
      // เมื่อ modal ปิด ให้ reset state
      setDeviceCode('');
      setDeviceCodeError('');
    }
  }, [showModal]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // mock data
      const mockProducts = [
        {
          id: '1',
          name: 'Arkad HM',
          device_type: 'Arkad_HM',
          model: 'Model Arkad-HM',
          description: 'Home Monitor',
          image: require('@/assets/images/device/Arkad_HM.png'),
        },
        {
          id: '2',
          name: 'Arkad M&C',
          device_type: 'Arkad_M&C',
          model: 'Model Arkad-MC',
          description: 'Monitor & Control',
          image: require('@/assets/images/device/Arkad_MC.png'),
        },
        {
          id: '3',
          name: 'Arkad OS',
          device_type: 'Arkad_OS',
          model: 'Model Arkad-OS',
          description: 'Outdoor Sensor',
          image: require('@/assets/images/device/Arkad_OS.png'),
        },
        {
          id: '4',
          name: 'Arkad PBM',
          device_type: 'Arkad_PBM',
          model: 'Model Arkad-PBM',
          description: 'Portable Monitor',
          image: require('@/assets/images/device/Arkad_PBM.png'),
        },
        {
          id: '5',
          name: 'Arkad PCM',
          device_type: 'Arkad_PCM',
          model: 'Model Arkad-PCM',
          description: 'Portable Control Monitor',
          image: require('@/assets/images/device/Arkad_PCM.png'),
        },
        {
          id: '6',
          name: 'Arkad WM',
          device_type: 'Arkad_WM',
          model: 'Model Arkad-WM',
          description: 'Wall Monitor',
          image: require('@/assets/images/device/Arkad_WM.png'),
        },
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleContinue = () => {
    if (!selectedProduct) {
      alert(t('myhome.choose_product'));
      return;
    }
    setDeviceCode('');
    setDeviceCodeError('');
    setShowModal(true);
  };

  const handleModalNext = async () => {
    // ตรวจสอบรหัสอุปกรณ์ (6-8 ตัวอักษร/ตัวเลข ไม่สนใจพิมพ์เล็ก-ใหญ่)
    if (!deviceCode || deviceCode.length < 6 || deviceCode.length > 8) {
      setDeviceCodeError(t('myhome.Deviceisinvalid'));
      return;
    }
    try {
      // เรียก API เพื่อตรวจสอบรหัสอุปกรณ์
      console.log(selectedProduct)
      const res = await fetchCheckPassword(selectedProduct.device_type, deviceCode);
      console.log(res);
      if (res.data == null) {
        setDeviceCodeError(t('myhome.DeviceInvalid'));
        return;
      }
      if (!res?.success) {
        setDeviceCodeError(t('myhome.DeviceInvalid'));
        return;
      }
      setShowModal(false);
      router.push({
        pathname: '/device-scan/DeviceScanner',
        params: {
          productId: res.data?.device_id,
          productName: selectedProduct.name,
          productModel: selectedProduct.device_type,
          deviceCode: deviceCode,
        }
      });
    } catch (err) {
      setDeviceCodeError(t('myhome.DeviceInvalid'));
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedProduct?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSelectProduct(item)}
      activeOpacity={0.85}
    >
      <Image source={item.image} style={styles.productImage} resizeMode="contain" />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productModel}>{item.model}</Text>
      <Text style={styles.productDesc}>{item.description}</Text>
      {selectedProduct?.id === item.id && (
        <Ionicons name="checkmark-circle" size={28} color="#2196f3" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safearea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#fff"
          translucent={false}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('myhome.select_your_product')}</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>{t('myhome.productsFound')}</Text>

            {isLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196f3" />
                <Text style={styles.loadingText}>{t('myhome.searching_device')}</Text>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.gridList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                numColumns={2}
                key={'product-grid-2'}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Ionicons name="information-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyListText}>
                      {t('myhome.no_products_found')}
                    </Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedProduct && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!selectedProduct}
            >
              <Text style={styles.continueButtonText}>{t('myhome.next')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView >

        {/* Modal สำหรับกรอกรหัสอุปกรณ์ */}




      </SafeAreaView>
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={() => {
          setShowModal(false);
          setDeviceCode('');           // ลบตัวอักษร
          setDeviceCodeError('');      // ลบข้อความ error
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('myhome.Devicepassword')}</Text>
            <Text style={styles.modalDesc}>{t('myhome.note_password')}</Text>
            <TextInput
              style={[styles.input, deviceCodeError && { borderColor: '#FF3B30', color: '#000' }]}
              placeholder={t('myhome.Devicepassword')}
              placeholderTextColor="#999"
              value={deviceCode}
              onChangeText={text => {
                // อนุญาตทั้งพิมพ์เล็กและพิมพ์ใหญ่
                setDeviceCode(text.replace(/[^A-Za-z0-9]/g, ''));
                setDeviceCodeError('');
              }}
              autoCapitalize="none"
              maxLength={8}
              textAlign="center"
            />
            {deviceCodeError ? (
              <Text style={styles.errorText}>{deviceCodeError}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.continueButton, { flex: 1, marginRight: 8 }]}
                onPress={handleModalNext}
              >
                <Text style={styles.continueButtonText}>{t('myhome.next')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueButton, styles.disabledButton, { flex: 1 }]}
                onPress={() => {
                  setShowModal(false);
                  setDeviceCode('');           // ลบตัวอักษร
                  setDeviceCodeError('');      // ลบข้อความ error
                }}
              >
                <Text style={styles.continueButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 35 : 25, // ปรับถ้าจำเป็น

    backgroundColor: '#fff'
  },
  safearea: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333'
  },
  gridList: {
    paddingBottom: 16,
    paddingHorizontal: 2
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minWidth: 150,
    maxWidth: '48%',
    position: 'relative'
  },
  selectedCard: {
    //borderColor: '#2196f3',
    //backgroundColor: 'rgba(33,150,243,0.07)'
  },
  productImage: {
    width: 70,
    height: 70,
    marginBottom: 10,
    borderRadius: 12
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center'
  },
  productModel: {
    fontSize: 13,
    color: '#2196f3',
    marginBottom: 2,
    textAlign: 'center'
  },
  productDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center'
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyListText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
    fontSize: 16
  },
  continueButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
    marginTop: Platform.OS === 'ios' ? 35 : 30, // ปรับถ้าจำเป็น
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  }
});