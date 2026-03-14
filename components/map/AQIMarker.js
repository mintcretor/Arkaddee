// components/map/AQIMarker.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

// คอมโพเนนต์วงกลมที่มีตัวเลข AQI (pwr === 1)
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

// คอมโพเนนต์วงกลมสีเทา แสดง "OFF" (pwr === 0)
const MarkerCircleOff = () => (
  <View style={[styles.circleMarker, styles.circleOff]}>
    <Text style={styles.markerText}>OFF</Text>
  </View>
);

// คอมโพเนนต์มาร์กเกอร์ (ใช้ React.memo เพื่อลดการเรนเดอร์ซ้ำ)
const AQIMarker = React.memo(({ point, onPress, memberCount = 1 }) => {
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceUpdate(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
    return null;
  }

  if (point.pwr === null || point.pwr === undefined) {
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude,
      }}
      onPress={() => onPress(point)}
      tracksViewChanges={!forceUpdate}
    >
      <TouchableOpacity
        style={styles.markerContainer}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        activeOpacity={0.7}
      >
        {point.pwr === 1 ? (
          <MarkerCircle aqi={point.aqi} />
        ) : (
          <MarkerCircleOff />
        )}

        {/* ✅ badge จำนวนสมาชิกในกลุ่ม */}
        {memberCount > 1 && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>{memberCount}</Text>
          </View>
        )}
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
  circleOff: {
    backgroundColor: '#BDBDBD', // สีเทาสำหรับ OFF
  },

  memberBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4A6FA5',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
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