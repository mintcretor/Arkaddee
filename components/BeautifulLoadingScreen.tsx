import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const BeautifulLoadingScreen = ({ progress = 0, message = "กำลังโหลดข้อมูลคุณภาพอากาศ..." }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  
  // ค่าสำหรับการเคลื่อนไหวของ particle
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // แอนิเมชันเปิดตัว
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // แอนิเมชันของ particle ที่ลอยอยู่
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(particle1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle2, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(particle2, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle3, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(particle3, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
    
    // แอนิเมชันของวงกลมโหลด
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  // อัปเดตแถบความคืบหน้า
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  // การหมุนของวงกลมโหลด
  const spin = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // การเคลื่อนไหวของ particle
  const translateY1 = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });
  
  const translateY2 = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });
  
  const translateX3 = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25]
  });
  
  // คำนวณความกว้างของแถบความคืบหน้า
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient
      colors={['#2196F3', '#4FC3F7', '#81D4FA']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* ส่วนแสดงไอคอนและอนุภาคลอย */}
        <View style={styles.iconContainer}>
          <Animated.View 
            style={[
              styles.particle,
              {
                top: -30,
                left: -20,
                transform: [{ translateY: translateY1 }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.particle,
              {
                top: 10,
                right: -15,
                transform: [{ translateY: translateY2 }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.particle,
              {
                bottom: 0,
                left: 20,
                transform: [{ translateX: translateX3 }]
              }
            ]}
          />
          
          {/* ไอคอนแผนที่ใช้ MaterialIcons แทนรูปภาพ */}
          <View style={styles.mapIconContainer}>
            <MaterialIcons name="map" size={50} color="#2196F3" />
          </View>
          
          {/* วงกลมหมุนรอบไอคอน */}
          <Animated.View 
            style={[
              styles.spinner,
              {
                transform: [{ rotate: spin }]
              }
            ]}
          />
        </View>
        
        <Text style={styles.title}>Air Quality Index</Text>
        <Text style={styles.subtitle}>Thailand</Text>
        
        <Text style={styles.message}>{message}</Text>
        
        {/* แถบความคืบหน้า */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressWidth
              }
            ]}
          />
        </View>
        
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  content: {
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  spinner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderTopColor: 'transparent',
    borderLeftColor: 'rgba(33, 150, 243, 0.5)',
    borderRightColor: 'rgba(33, 150, 243, 0.5)',
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  }
});

export default BeautifulLoadingScreen;