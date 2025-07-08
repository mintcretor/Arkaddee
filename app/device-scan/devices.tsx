import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DeviceManager from '@/services/DeviceManager';
import * as TuyaService from '@/services/TuyaService';

export default function DevicesScreen() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [rooms, setRooms] = useState(['All']);
  
  // โหลดข้อมูลอุปกรณ์
  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
      
      // ดึงรายการอุปกรณ์ทั้งหมด
      const allDevices = await DeviceManager.getDevices();
      
      // รวบรวมรายชื่อห้องทั้งหมด
      const allRooms = ['All', ...new Set(allDevices.map(device => device.room).filter(Boolean))];
      setRooms(allRooms);
      
      // อัปเดตสถานะอุปกรณ์จาก Tuya API
      const updatedDevices = await Promise.all(
        allDevices.map(async (device) => {
          try {
            // ดึงสถานะล่าสุดจาก Tuya API
            await TuyaService.getDeviceStatus(device.tuya_device_id);
            return { ...device, status: 'online' };
          } catch (error) {
            console.error(`Error fetching status for device ${device.name}:`, error);
            return { ...device, status: 'offline' };
          }
        })
      );
      
      setDevices(updatedDevices);
    } catch (error) {
     // console.error('Error loading devices:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadDevices();
  }, []);
  
  // กรองอุปกรณ์ตามการค้นหาและห้อง
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoom = selectedRoom === 'All' || device.room === selectedRoom;
    return matchesSearch && matchesRoom;
  });
  
  // รับไอคอนตามประเภทอุปกรณ์
  const getDeviceTypeIcon = (type) => {
    switch (type) {
      case 'air_quality':
        return 'leaf-outline';
      case 'light':
        return 'bulb-outline';
      case 'plug':
        return 'power-outline';
      case 'thermostat':
        return 'thermometer-outline';
      case 'camera':
        return 'videocam-outline';
      default:
        return 'cube-outline';
    }
  };
  
  // แปลงประเภทอุปกรณ์เป็นข้อความไทย
  const getDeviceTypeText = (type) => {
    switch (type) {
      case 'air_quality':
        return 'เครื่องฟอกอากาศ';
      case 'light':
        return 'ไฟอัจฉริยะ';
      case 'plug':
        return 'ปลั๊กอัจฉริยะ';
      case 'thermostat':
        return 'เครื่องปรับอากาศ';
      case 'camera':
        return 'กล้องวงจรปิด';
      default:
        return 'อุปกรณ์อัจฉริยะ';
    }
  };
  
  // แสดงรายการอุปกรณ์
  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => router.push({
        pathname: '/device-scan/device-control',
        params: {
          deviceId: item.id,
        }
      })}
    >
      <View style={styles.deviceIconContainer}>
        <Ionicons name={getDeviceTypeIcon(item.type)} size={24} color="#fff" />
      </View>
      
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceType}>{getDeviceTypeText(item.type)}</Text>
        {item.room && (
          <View style={styles.roomTag}>
            <Ionicons name="home-outline" size={12} color="#666" />
            <Text style={styles.roomText}>{item.room}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.deviceActions}>
        <View style={[
          styles.statusIndicator,
          item.status === 'online' ? styles.statusOnline : styles.statusOffline
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'online' ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({
            pathname: '/device-edit',
            params: { deviceId: item.id }
          })}
        >
          <Ionicons name="settings-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  // แสดงตัวกรองห้อง
  const renderRoomFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.roomFilterContainer}
    >
      {rooms.map(room => (
        <TouchableOpacity
          key={room}
          style={[
            styles.roomFilterItem,
            selectedRoom === room && styles.roomFilterItemSelected
          ]}
          onPress={() => setSelectedRoom(room)}
        >
          <Text style={[
            styles.roomFilterText,
            selectedRoom === room && styles.roomFilterTextSelected
          ]}>
            {room}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อุปกรณ์ทั้งหมด</Text>
        <TouchableOpacity onPress={() => router.push('/device-scan/DeviceScanner')}>
          <Ionicons name="add-circle-outline" size={24} color="#2EE3DA" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาอุปกรณ์..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {renderRoomFilter()}
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2EE3DA" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลอุปกรณ์...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.devicesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadDevices}
              colors={['#2EE3DA']}
              tintColor="#2EE3DA"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery || selectedRoom !== 'All' ? (
                <>
                  <Ionicons name="search" size={60} color="#ddd" />
                  <Text style={styles.emptyText}>
                    ไม่พบอุปกรณ์ที่ตรงกับการค้นหา
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="cube-outline" size={60} color="#ddd" />
                  <Text style={styles.emptyText}>
                    ยังไม่มีอุปกรณ์ในระบบ
                  </Text>
                  <TouchableOpacity
                    style={styles.addDeviceButton}
                    onPress={() => router.push('/device-scan/DeviceScanner')}
                  >
                    <Text style={styles.addDeviceButtonText}>
                      เพิ่มอุปกรณ์ใหม่
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      )}
      
      {/* Floating Action Button สำหรับเพิ่มอุปกรณ์ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/device-scan/DeviceScanner')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  roomFilterContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  roomFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  roomFilterItemSelected: {
    backgroundColor: '#2EE3DA',
  },
  roomFilterText: {
    color: '#666',
    fontSize: 14,
  },
  roomFilterTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  devicesList: {
    padding: 16,
    paddingBottom: 80, // ให้พื้นที่สำหรับปุ่ม FAB
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2EE3DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  deviceActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusOnline: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  editButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addDeviceButton: {
    backgroundColor: '#2EE3DA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addDeviceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2EE3DA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});