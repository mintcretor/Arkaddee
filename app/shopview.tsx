import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

export default function PlaceDetails() {
  const { placeId } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Arkad</Text>
          <Text style={styles.headerSubtitle}>Hello, Waratchaya</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationText}>123 Anywhere St. Any City</Text>
          </View>
        </View>
        <View style={styles.aqiContainer}>
          <Text style={styles.aqiText}>25</Text>
          <Text style={styles.aqiUnit}>µg/m³</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Main Image with Weather Info */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.weatherOverlay}>
            <Text style={styles.weatherText}>8 ℃</Text>
            <Text style={styles.weatherText}>0.52%</Text>
            <Text style={styles.weatherText}>450 มม.</Text>
          </View>
        </View>

        {/* Restaurant Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.restaurantName}>ร้านอร่อยอิ่มเล่ย</Text>
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              <Text>★ 4.85</Text>
              <Text style={styles.reviewCount}>177 reviews</Text>
            </View>
            <Text style={styles.openStatus}>เปิดอยู่ จนถึง 21:00</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text>ข้อมูลร้าน</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text>รีวิว</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          เป็นที่ตั้งร้านอาหารและคาเฟ่ในเชียงใหม่ที่ผสมผสานกับธรรมชาติได้อย่างลงตัว "ร้านอร่อยอิ่มเล่ย" บรรยากาศร่มรื่น 
          ตกแต่งด้วยต้นไม้ใหญ่ได้ Tropical Thai Moss Garden ตั้งอยู่ติดกับภูเขาจำลองระบบนิเวศน์ของน้ำตกเล็ก 
          รายล้อมไปด้วยแมกไม้นานาพันธุ์ มีที่ขายดอกและไม้ประดับ ที่แขกมาอุดหนุนกันไปเต็มๆ
        </Text>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color="#fff" />
          <Text style={styles.tabLabel}>My Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="cloud" size={24} color="#fff" />
          <Text style={styles.tabLabel}>Air Quality</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerTab}>
          <View style={styles.centerTabInner}>
            <Ionicons name="grid" size={35} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="cube" size={24} color="#fff" />
          <Text style={styles.tabLabel}>Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person" size={24} color="#fff" />
          <Text style={styles.tabLabel}>Me</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4B74B3',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    marginLeft: 4,
  },
  aqiContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  aqiText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  aqiUnit: {
    color: '#666',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  weatherOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  weatherText: {
    color: '#fff',
    marginVertical: 2,
  },
  titleSection: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    color: '#666',
    marginLeft: 8,
  },
  openStatus: {
    color: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  description: {
    padding: 16,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#4B74B3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#4B74B3',
    height: 60,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  centerTab: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  centerTabInner: {
    backgroundColor: '#0066FF',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});