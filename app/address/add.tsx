import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASEAPI_CONFIG } from '@/config';
import DropDownPicker from 'react-native-dropdown-picker';

interface Tambon {
  id: number;
  name_th: string;
  name_en: string;
  zip_code: number;
  amphure_id: number;
}

interface Amphure {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
  tambon: Tambon[];
}

interface ProvinceData {
  id: number;
  name_th: string;
  name_en: string;
  geography_id: number;
  amphure: Amphure[];
}

interface UserAddress {
  account_id: string;
  address_line1: string;
  address_line2: string;
  address_name: string;
  created_at: string;
  district: string;
  id: number;
  postal_code: string;
  province: string;
  receiver_name: string;
  sub_district: string;
  updated_at: string;
  is_default: boolean;
  message?: string;
}

const API_ADDRESS_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

const AddAddressScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [subDistrictOpen, setSubDistrictOpen] = useState(false);

  const [allAddressData, setAllAddressData] = useState<ProvinceData[]>([]);
  const [provinceItems, setProvinceItems] = useState([]);
  const [districtItems, setDistrictItems] = useState([]);
  const [subDistrictItems, setSubDistrictItems] = useState([]);

  const [formData, setFormData] = useState({
    receiverName: '',
    addressLine1: '',
    addressLine2: '',
    province: '',
    district: '',
    subDistrict: '',
    postalCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState({});

  const getNameByLanguage = useCallback((item: { name_th: string; name_en: string }) => {
    return i18n.language === 'th' ? item.name_th : item.name_en;
  }, [i18n.language]);

  // Close all dropdowns when one opens (iOS fix)
  const closeAllDropdowns = useCallback(() => {
    setProvinceOpen(false);
    setDistrictOpen(false);
    setSubDistrictOpen(false);
  }, []);

  // Combined useEffect to fetch all data concurrently
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staticAddressResponse, userAddressResponse] = await Promise.all([
          fetch(API_ADDRESS_URL),
          AsyncStorage.getItem('userToken').then(token =>
            fetch(`${BASEAPI_CONFIG.baseUrl}/addresses`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          ),
        ]);

        const staticData: ProvinceData[] = await staticAddressResponse.json();
        setAllAddressData(staticData);
        const provinces = staticData.map(item => ({ label: getNameByLanguage(item), value: item.name_th }));
        setProvinceItems(provinces);

        const userAddressData: UserAddress = await userAddressResponse.json();

        if (userAddressData && userAddressData.message !== 'ไม่พบข้อมูลที่อยู่' && userAddressData.id) {
          setFormData({
            receiverName: userAddressData.receiver_name || '',
            addressLine1: userAddressData.address_line1 || '',
            addressLine2: userAddressData.address_line2 || '',
            province: userAddressData.province || '',
            district: userAddressData.district || '',
            subDistrict: userAddressData.sub_district || '',
            postalCode: userAddressData.postal_code || '',
            isDefault: userAddressData.is_default || false,
          });
          setIsEditMode(true);

          const initialProvince = userAddressData.province;
          const initialDistrict = userAddressData.district;
          const initialSubDistrict = userAddressData.sub_district;

          if (initialProvince) {
            const selectedProvinceData = staticData.find(p => p.name_th === initialProvince);
            if (selectedProvinceData) {
              const districts = selectedProvinceData.amphure.map(item => ({
                label: getNameByLanguage(item),
                value: item.name_th
              }));
              setDistrictItems(districts);

              if (initialDistrict) {
                const selectedAmphureData = selectedProvinceData.amphure.find(a => a.name_th === initialDistrict);
                if (selectedAmphureData) {
                  const subDistricts = selectedAmphureData.tambon.map(item => ({
                    label: getNameByLanguage(item),
                    value: item.name_th
                  }));
                  setSubDistrictItems(subDistricts);

                  const foundTambon = selectedAmphureData.tambon.find(t => t.name_th === initialSubDistrict);
                  if (foundTambon) {
                    setFormData(prev => ({
                      ...prev,
                      postalCode: String(foundTambon.zip_code),
                    }));
                  }
                }
              }
            }
          }
        } else {
          setIsEditMode(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert(t('common.error'), t('address.fetch_data_failed'));
        setIsEditMode(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t, getNameByLanguage]);

  const handleProvinceChange = useCallback((provinceThName: string | null) => {
    setFormData(prev => ({
      ...prev,
      province: provinceThName || '',
      district: '',
      subDistrict: '',
      postalCode: '',
    }));
    setDistrictItems([]);
    setSubDistrictItems([]);

    if (provinceThName) {
      const selectedProvince = allAddressData.find(p => p.name_th === provinceThName);
      if (selectedProvince) {
        const districts = selectedProvince.amphure.map(item => ({ label: getNameByLanguage(item), value: item.name_th }));
        setDistrictItems(districts);
      }
    }
  }, [allAddressData, getNameByLanguage]);

  const handleDistrictChange = useCallback((districtThName: string | null) => {
    setFormData(prev => ({
      ...prev,
      district: districtThName || '',
      subDistrict: '',
      postalCode: '',
    }));
    setSubDistrictItems([]);

    if (districtThName && formData.province) {
      const selectedProvince = allAddressData.find(p => p.name_th === formData.province);
      if (selectedProvince) {
        const selectedAmphure = selectedProvince.amphure.find(a => a.name_th === districtThName);
        if (selectedAmphure) {
          const subDistricts = selectedAmphure.tambon.map(item => ({ label: getNameByLanguage(item), value: item.name_th }));
          setSubDistrictItems(subDistricts);
        }
      }
    }
  }, [allAddressData, formData.province, getNameByLanguage]);

  const handleSubDistrictChange = useCallback((subDistrictThName: string | null) => {
    setFormData(prev => ({
      ...prev,
      subDistrict: subDistrictThName || '',
      postalCode: '',
    }));

    if (subDistrictThName && formData.province && formData.district) {
      const selectedProvince = allAddressData.find(p => p.name_th === formData.province);
      if (selectedProvince) {
        const selectedAmphure = selectedProvince.amphure.find(a => a.name_th === formData.district);
        if (selectedAmphure) {
          const foundTambon = selectedAmphure.tambon.find(t => t.name_th === subDistrictThName);
          setFormData(prev => ({
            ...prev,
            postalCode: foundTambon ? String(foundTambon.zip_code) : '',
          }));
        }
      }
    }
  }, [allAddressData, formData.province, formData.district]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validatePostalCode = (postalCode: string) => {
    const postalCodeRegex = /^[0-9]{5}$/;
    return postalCodeRegex.test(postalCode);
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.receiverName.trim()) { newErrors.receiverName = t('address.error_receiverName'); }
    if (!formData.addressLine1.trim()) { newErrors.addressLine1 = t('address.error_addressLine1'); }
    if (!formData.province.trim()) { newErrors.province = t('address.error_province'); }
    if (!formData.district.trim()) { newErrors.district = t('address.error_district'); }
    if (!formData.subDistrict.trim()) { newErrors.subDistrict = t('address.error_subDistrict'); }
    if (!formData.postalCode.trim()) { newErrors.postalCode = t('address.error_postalCode'); }
    else if (!validatePostalCode(formData.postalCode)) { newErrors.postalCode = t('address.error_postalCode_invalid'); }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.incompleteData'), t('common.pleaseFillAllFields'));
      return;
    }
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASEAPI_CONFIG.baseUrl}/addresses`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(t('common.success'), isEditMode ? t('address.editsuccess') : t('address.addsuccess'));
        router.back();
      } else {
        const errorMessage = data.message || t('address.Unable_save');
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert(t('common.error'), t('address.Unable_save'));
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    label: string,
    field: string,
    placeholder: string,
    keyboardType: string = 'default',
    maxLength?: number | null
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] ? styles.inputError : null]}
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        maxLength={maxLength === null ? undefined : maxLength}
      />
      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  const flatListData = [{ id: 'addressForm', type: 'form' }];

  const renderFlatListItem = ({ item }: { item: { id: string, type: string } }) => {
    if (item.type === 'form') {
      return (
        <View style={styles.formSection}>
          {renderField(t('address.Recipient'), 'receiverName', t('address.Fullname'))}
          {renderField(t('address.Address'), 'addressLine1', t('address.AddressNo'))}
          {renderField(t('address.Additional'), 'addressLine2', t('address.AddresAddinional'))}

          {/* Province Dropdown */}
          <View style={[styles.fieldContainers, { zIndex: 5000 }]}>
            <Text style={styles.fieldLabels}>{t('address.province')}</Text>
            <DropDownPicker
              open={provinceOpen}
              value={formData.province}
              items={provinceItems}
              setOpen={(open) => {
                if (open) closeAllDropdowns();
                setProvinceOpen(open);
              }}
              setValue={val => {
                setFormData(prev => ({ ...prev, province: val() || '' }));
                handleProvinceChange(val());
              }}
              setItems={setProvinceItems}
              placeholder={t('address.c_province')}
              placeholderTextColor="#999"
              onChangeValue={handleProvinceChange}
              listMode="MODAL"
              modalProps={{
                animationType: "slide"
              }}
              modalContentContainerStyle={styles.modalContentContainer}
              modalTitle={t('address.c_province')}
              style={[styles.dropdownMainStyle, errors.province ? styles.inputError : null]}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              selectedItemContainerStyle={styles.selectedItemContainer}
              searchable={true}
              searchPlaceholder={t('address.searchprovince')}
              placeholderTextColor="#999"
            />
            {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}
          </View>

          {/* District Dropdown */}
          <View style={[styles.fieldContainers, { zIndex: 4000 }]}>
            <Text style={styles.fieldLabels}>{t('address.District')}</Text>
            <DropDownPicker
              open={districtOpen}
              value={formData.district}
              items={districtItems}
              setOpen={(open) => {
                if (open) closeAllDropdowns();
                setDistrictOpen(open);
              }}
              setValue={val => {
                setFormData(prev => ({ ...prev, district: val() || '' }));
                handleDistrictChange(val());
              }}
              setItems={setDistrictItems}
              placeholder={t('address.c_District')}
              placeholderTextColor="#999"
              onChangeValue={handleDistrictChange}
              disabled={!formData.province}
              listMode="MODAL"
              modalProps={{
                animationType: "slide"
              }}
              modalContentContainerStyle={styles.modalContentContainer}
              modalTitle={t('address.c_District')}
              style={[styles.dropdownMainStyle, errors.district ? styles.inputError : null]}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              selectedItemContainerStyle={styles.selectedItemContainer}
              searchable={true}
              searchPlaceholder={t('address.searchDistrict')}
              placeholderTextColor="#999"
            />
            {errors.district ? <Text style={styles.errorText}>{errors.district}</Text> : null}
          </View>

          {/* SubDistrict Dropdown */}
          <View style={[styles.fieldContainers, { zIndex: 3000 }]}>
            <Text style={styles.fieldLabels}>{t('address.Subdistrict')}</Text>
            <DropDownPicker
              open={subDistrictOpen}
              value={formData.subDistrict}
              items={subDistrictItems}
              setOpen={(open) => {
                if (open) closeAllDropdowns();
                setSubDistrictOpen(open);
              }}
              setValue={val => {
                setFormData(prev => ({ ...prev, subDistrict: val() || '' }));
                handleSubDistrictChange(val());
              }}
              setItems={setSubDistrictItems}
              placeholder={t('address.c_Subdistrict')}
              placeholderTextColor="#999"
              onChangeValue={handleSubDistrictChange}
              disabled={!formData.district}
              listMode="MODAL"
              modalProps={{
                animationType: "slide"
              }}
              modalContentContainerStyle={styles.modalContentContainer}
              modalTitle={t('address.c_Subdistrict')}
              style={[styles.dropdownMainStyle, errors.subDistrict ? styles.inputError : null]}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              selectedItemContainerStyle={styles.selectedItemContainer}
              searchable={true}
              searchPlaceholder={t('address.searchSubDistrict')}
              placeholderTextColor="#999"
            />
            {errors.subDistrict ? <Text style={styles.errorText}>{errors.subDistrict}</Text> : null}
          </View>

          {renderField(t('address.postalCode'), 'postalCode', '10xxx', 'numeric', 5)}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? t('address.edit') : t('address.add')}</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>{t('address.loading_address_data')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            data={flatListData}
            renderItem={renderFlatListItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!provinceOpen && !districtOpen && !subDistrictOpen}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditMode ? t('address.edit') : t('address.add')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 35 : 0, // ปรับถ้าจำเป็น

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000'
  },
  rightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    color: '#000',
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldContainers: {
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  fieldLabels: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000'
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    elevation: 3,
    maxHeight: 300,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMainStyle: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 0,
    minHeight: 50,
  },
  selectedItemContainer: {
    backgroundColor: '#e6f2ff',
  },
  modalContentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
    maxHeight: '100%',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default AddAddressScreen;