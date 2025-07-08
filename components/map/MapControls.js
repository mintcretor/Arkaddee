// components/map/MapControls.js
import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// คอมโพเนนต์ปุ่มควบคุมแผนที่ทั้งหมด
const MapControls = ({
  isDataLoading,
  apiSource,
  getApiSourceName,
  toggleApiSource,
  goToCurrentLocation,
  fetchAQIData,
  aqiPoints,
  onOpenRanking,  // เพิ่มพร็อพสำหรับเปิดหน้าจัดอันดับ
}) => {
  return (
    <>
      {/* ปุ่มตำแหน่งปัจจุบัน */}
      <TouchableOpacity 
        style={styles.currentLocationButton}
        onPress={goToCurrentLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#2196F3" />
      </TouchableOpacity>

      {/* ปุ่มสลับแหล่งข้อมูล API */}
      <TouchableOpacity 
        style={styles.apiToggleButton}
        onPress={toggleApiSource}
        disabled={isDataLoading} // ปิดปุ่มระหว่างโหลดข้อมูล
      >
        <MaterialIcons name="swap-horiz" size={24} color={isDataLoading ? "#ccc" : "#2196F3"} />
        <Text style={[styles.apiToggleText, isDataLoading && {color: "#ccc"}]}>
          {getApiSourceName()}
        </Text>
      </TouchableOpacity>

      {/* ปุ่มแสดงการจัดอันดับคุณภาพอากาศ (ใหม่) */}
      <TouchableOpacity 
        style={styles.rankingButton}
        onPress={onOpenRanking}
      >
        <MaterialIcons name="format-list-numbered" size={24} color="white" />
      </TouchableOpacity>

      {/* แสดงข้อความระหว่างโหลดข้อมูล */}
      {isDataLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลคุณภาพอากาศ</Text>
        </View>
      )}

      {/* แสดงข้อความเมื่อไม่มีข้อมูล */}
      {!isDataLoading && aqiPoints.length === 0 && (
        <View style={styles.noDataOverlay}>
          <MaterialIcons name="info-outline" size={24} color="#FF5757" />
          <Text style={styles.noDataText}>ไม่พบข้อมูลคุณภาพอากาศ</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchAQIData}
          >
            <Text style={styles.retryButtonText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  currentLocationButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  apiToggleButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  apiToggleText: {
    marginLeft: 5,
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // สไตล์สำหรับปุ่มจัดอันดับ (ใหม่)
  rankingButton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: '#2196F3',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#555',
    fontSize: 14,
  },
  noDataOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  noDataText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MapControls;