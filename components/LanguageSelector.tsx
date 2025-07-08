// components/LanguageSelector.jsx หรือ .tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isEnglish, setIsEnglish] = React.useState(i18n.language !== 'th');

  // สร้าง animated value สำหรับการเลื่อนตัวชี้
  const slideAnim = React.useRef(new Animated.Value(isEnglish ? 1 : 0)).current;

  // อัปเดต animation เมื่อคอมโพเนนต์โหลด
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isEnglish ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isEnglish]);

  // คำนวณตำแหน่ง X ของตัวชี้
  const indicatorPosition = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const toggleLanguage = async () => {
    try {
      const newLanguage = isEnglish ? 'th' : 'en';
      const newIsEnglish = !isEnglish;

      // เปลี่ยน state ก่อนเพื่อให้ animation ทำงาน
      setIsEnglish(newIsEnglish);

      // เปลี่ยนภาษาของแอป
      await i18n.changeLanguage(newLanguage);
      await AsyncStorage.setItem('user-language', newLanguage);

      console.log('Language changed to:', newLanguage);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.languageSelector}
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        {/* ตัวชี้ภาษาที่เลือก (วงกลมสีขาว) */}
        <Animated.View
          style={[
            styles.indicator,
            { left: indicatorPosition }
          ]}
        />

        {/* ฝั่งซ้าย: ภาษาไทย */}
        <View style={[styles.languageOption, styles.leftOption]}>
          <Text style={[
            styles.languageText,
            !isEnglish ? styles.activeText : styles.inactiveText
          ]}>
            🇹🇭 ไทย
          </Text>
        </View>

        {/* ฝั่งขวา: ภาษาอังกฤษ */}
        <View style={[styles.languageOption, styles.rightOption]}>
          <Text style={[
            styles.languageText,
            isEnglish ? styles.activeText : styles.inactiveText
          ]}>
            🇺🇸 Eng
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  
  },
  languageSelector: {
    flexDirection: 'row',
    width: 150,
    height: 40,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    width: '48%',
    height: '85%',
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  languageOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftOption: {
    paddingRight: 5,
  },
  rightOption: {
    paddingLeft: 5,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: '#333',
  },
  inactiveText: {
    color: '#777',
  },
});

export default LanguageSelector;