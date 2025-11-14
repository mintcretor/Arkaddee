// components/AQIRankingModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DataProviderFactory from '@/services/DataProviders/DataProviderFactory';
import { useTranslation } from 'react-i18next';

const AQIRankingModal = ({ visible, onClose }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [indoorData, setIndoorData] = useState([]);
  const [outdoorData, setOutdoorData] = useState([]);
  const [activeTab, setActiveTab] = useState('indoor');
  const [rankingType, setRankingType] = useState('best');
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0); // เพิ่ม key สำหรับ force refresh

  // ✅ แก้ไข: Reset state และ fetch ข้อมูลใหม่ทุกครั้งที่เปิด modal
  useEffect(() => {
    if (visible) {
      // Reset state ก่อนเสมอ
      setLoading(true);
      setIndoorData([]);
      setOutdoorData([]);
      
      // Delay เล็กน้อยเพื่อให้ UI reset ก่อน
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // ✅ เพิ่ม: เมื่อปิด modal ให้ reset state
      setIndoorData([]);
      setOutdoorData([]);
      setActiveTab('indoor');
      setRankingType('best');
    }
  }, [visible, refreshKey]); // เพิ่ม refreshKey เป็น dependency

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching ranking data...'); // เพิ่ม log เพื่อ debug
      
      // ดึงข้อมูลภายในอาคาร (default provider)
      const indoorProvider = DataProviderFactory.getProvider('default');
      const indoorPoints = await indoorProvider.fetchData();
      console.log('📥 Indoor data:', indoorPoints?.length || 0, 'points');
      
      // ดึงข้อมูลภายนอกอาคาร (secondary provider)
      const outdoorProvider = DataProviderFactory.getProvider('secondary');
      const outdoorPoints = await outdoorProvider.fetchData();
      console.log('📥 Outdoor data:', outdoorPoints?.length || 0, 'points');
      
      // เรียงลำดับข้อมูลตาม AQI
      setIndoorData(sortData(indoorPoints));
      setOutdoorData(sortData(outdoorPoints));
      
      console.log('✅ Data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching ranking data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ แก้ไข: ปรับปรุงฟังก์ชัน refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshKey(prev => prev + 1); // เพิ่ม key เพื่อ trigger useEffect
  };

  // ฟังก์ชันเรียงลำดับข้อมูล
  const sortData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    // คัดกรองข้อมูลที่มี aqi เป็นค่าว่างหรือไม่ใช่ตัวเลข
    const filteredData = data.filter(item => 
      item && typeof item.aqi === 'number' && !isNaN(item.aqi)
    );
    
    // เรียงลำดับจากน้อยไปมาก (อากาศดีไปแย่)
    return [...filteredData].sort((a, b) => a.aqi - b.aqi);
  };

  // ข้อมูลที่จะแสดงบนหน้าจอ
  const getRankingData = () => {
    const sourceData = activeTab === 'indoor' ? indoorData : outdoorData;
    
    if (!sourceData || sourceData.length === 0) {
      return [];
    }
    
    if (rankingType === 'best') {
      return sourceData.slice(0, 10);
    } else {
      return [...sourceData].reverse().slice(0, 10);
    }
  };

  // ฟังก์ชันแสดงสีตามค่า AQI
  const getAQIColor = (aqi) => {
    if (aqi <= 15) return "#01BFF6";
    else if (aqi <= 25) return "#96D158";
    else if (aqi <= 37.5) return "#FFDD55";
    else if (aqi <= 75) return "#FF9B57";
    else return "#FF5757";
  };

  // แสดงข้อความระดับคุณภาพอากาศ
  const getAQILevel = (aqi) => {
    if (aqi <= 15) return t('myhome.VERYGOOD');
    else if (aqi <= 25) return t('myhome.GOOD');
    else if (aqi <= 37.5) return t('myhome.MODERATE');
    else if (aqi <= 75) return t('myhome.POOR');
    else return t('myhome.VERYPOOR');
  };

  // ฟังก์ชันสำหรับการนำทางไปยังหน้ารายละเอียดสถานที่
  const handlePlacePress = (item) => {
    if (activeTab === 'outdoor' && item && item.id) {
      onClose();
      
      router.push({
        pathname: `/places/details`,
        params: {
          id: item.id
        }
      });
    }
  };

  // รายการสำหรับแสดงในลิสต์
  const renderItem = ({ item, index }) => {
    const isIndoorItem = activeTab === 'outdoor';
    const ListItemComponent = isIndoorItem ? TouchableOpacity : View;
    
    const additionalProps = isIndoorItem ? {
      onPress: () => handlePlacePress(item),
      activeOpacity: 0.7
    } : {};
    
    return (
      <ListItemComponent
        style={[
          styles.listItem,
          isIndoorItem && styles.clickableItem
        ]}
        {...additionalProps}
      >
        <View style={[styles.rankingCircle, {backgroundColor: getAQIColor(item.aqi)}]}>
          <Text style={styles.rankingNumber}>{index + 1}</Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.locationName} numberOfLines={1} ellipsizeMode="tail">
            {item.dustboy_name || t('common.Not_specified')}
          </Text>
          <Text style={styles.locationDetail} numberOfLines={1}>
            {getAQILevel(item.aqi)}
          </Text>
          
          {isIndoorItem && (
            <Text style={styles.tapToViewText}>
              <MaterialIcons name="info-outline" size={12} color="#4A6FA5" /> {t('common.clickfordetail')}
            </Text>
          )}
        </View>
        <View style={[styles.aqiBox, {backgroundColor: getAQIColor(item.aqi)}]}>
          <Text style={styles.aqiValue}>{Math.round(item.aqi)}</Text>
          <Text style={styles.aqiUnit}>µg/m³</Text>
        </View>
      </ListItemComponent>
    );
  };

  // แสดงข้อความเมื่อไม่มีข้อมูล
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="info-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>{t('airQuality.noDataAvailable')}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={handleRefresh}
      >
        <MaterialIcons name="refresh" size={20} color="#2196F3" />
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* แถบหัวเรื่อง */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {t('airQuality.Air_Quality_Index')}
          </Text>
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={styles.refreshButton}
            disabled={loading}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={loading ? "#ccc" : "#2196F3"} 
            />
          </TouchableOpacity>
        </View>

        {/* แถบการเลือก */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'indoor' && styles.activeTab]}
            onPress={() => setActiveTab('indoor')}
            disabled={loading}
          >
            <Text style={[styles.tabText, activeTab === 'indoor' && styles.activeTabText]}>
              {t('airQuality.outdoors')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'outdoor' && styles.activeTab]}
            onPress={() => setActiveTab('outdoor')}
            disabled={loading}
          >
            <Text style={[styles.tabText, activeTab === 'outdoor' && styles.activeTabText]}>
              {t('airQuality.indoors')}
            </Text>
            {activeTab === 'outdoor' && (
              <Text style={styles.tabNoteText}>
                ( {t('common.clickfordetail')})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* แถบการเลือกประเภทการจัดอันดับ */}
        <View style={styles.rankingTypeContainer}>
          <TouchableOpacity
            style={[styles.rankingTypeButton, rankingType === 'best' && styles.activeRankingType]}
            onPress={() => setRankingType('best')}
            disabled={loading}
          >
            <Text style={[styles.rankingTypeText, rankingType === 'best' && styles.activeRankingTypeText]}>
              {t('airQuality.best')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rankingTypeButton, rankingType === 'worst' && styles.activeRankingType]}
            onPress={() => setRankingType('worst')}
            disabled={loading}
          >
            <Text style={[styles.rankingTypeText, rankingType === 'worst' && styles.activeRankingTypeText]}>
              {t('airQuality.worst')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ส่วนแสดงผลข้อมูล */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={getRankingData()}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id || ''}-${index}-${refreshKey}`}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyComponent}
            extraData={refreshKey} // ✅ เพิ่ม extraData เพื่อ force re-render
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    marginTop: Platform.OS === 'android' ? 40 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabNoteText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  rankingTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  rankingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeRankingType: {
    backgroundColor: '#f0f9ff',
  },
  rankingTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeRankingTypeText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 80,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clickableItem: {
    backgroundColor: '#F5FAFF',
  },
  rankingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankingNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tapToViewText: {
    fontSize: 10,
    color: '#4A6FA5',
    marginTop: 4,
  },
  aqiBox: {
    width: 60,
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  aqiValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  aqiUnit: {
    color: 'white',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // ✅ เพิ่ม style สำหรับปุ่ม retry
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default AQIRankingModal;