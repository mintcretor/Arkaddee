// components/map/AQIMarker.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

// คอมโพเนนต์วงกลมที่มีตัวเลข AQI
const MarkerCircle = ({ aqi }) => {
  let backgroundColor;
  if (aqi <= 15) backgroundColor = "#01BFF6";
  else if (aqi <= 25) backgroundColor = "#96D158";
  else if (aqi <= 37.5) backgroundColor = "#FFDD55";
  else if (aqi <= 75) backgroundColor = "#FF9B57";
  else backgroundColor = "#FF5757";

  return (
    <View style={[styles.circleMarker, { backgroundColor }]}>
      <Text style={styles.markerText}>
        {Math.round(aqi)}
      </Text>
    </View>
  );
};

// คอมโพเนนต์มาร์กเกอร์ (ใช้ React.memo เพื่อลดการเรนเดอร์ซ้ำ)
const AQIMarker = React.memo(({ point, onPress }) => {
  const [forceUpdate, setForceUpdate] = useState(false);
  
  // บังคับให้มาร์กเกอร์เรนเดอร์หลังจากแมปพร้อม
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceUpdate(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // ป้องกันการเด้งในกรณีที่ point มีปัญหา
  if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
    return null; // ไม่แสดงมาร์กเกอร์ที่ข้อมูลมีปัญหา
  }
  
  return (
    <Marker
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude
      }}
      onPress={() => onPress(point)}
      tracksViewChanges={!forceUpdate} // เปลี่ยนเป็น false หลังจากแมปพร้อม
    >
      <TouchableOpacity 
        style={styles.markerContainer}
        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        activeOpacity={0.7}
      >
        <MarkerCircle aqi={point.aqi} />
      </TouchableOpacity>
    </Marker>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    zIndex: 5,
    elevation: 3,
  },
  circleMarker: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});

export default AQIMarker;