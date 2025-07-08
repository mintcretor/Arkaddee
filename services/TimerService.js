// services/TimerService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TuyaService from './TuyaService';

// ตั้งค่า notifications
export const setupNotifications = async () => {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

// บันทึกการตั้งค่าเวลา
export const saveTimerSettings = async (deviceId, settings) => {
  try {
    const timerSettings = {
      deviceId,
      enabled: settings.enabled,
      onTime: settings.onTime,
      offTime: settings.offTime,
      weekdays: settings.weekdays, // เพิ่มการตั้งค่าวันในสัปดาห์
      lastUpdated: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(`TIMER_SETTINGS_${deviceId}`, JSON.stringify(timerSettings));
    
    // ถ้าเปิดใช้งานตั้งเวลา ให้ตั้ง local notifications สำหรับเวลาเปิดและปิด
    if (settings.enabled) {
      await scheduleTimerNotifications(deviceId, settings);
    } else {
      await cancelTimerNotifications(deviceId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving timer settings:', error);
    throw error;
  }
};

// ดึงการตั้งค่าเวลา
export const getTimerSettings = async (deviceId) => {
  try {
    const settings = await AsyncStorage.getItem(`TIMER_SETTINGS_${deviceId}`);
    return settings ? JSON.parse(settings) : { 
      deviceId,
      enabled: false,
      onTime: '08:00',
      offTime: '22:00',
      weekdays: [true, true, true, true, true, true, true], // [อาทิตย์, จันทร์, อังคาร, พุธ, พฤหัส, ศุกร์, เสาร์]
    };
  } catch (error) {
    console.error('Error getting timer settings:', error);
    return { 
      deviceId,
      enabled: false,
      onTime: '08:00',
      offTime: '22:00',
      weekdays: [true, true, true, true, true, true, true],
    };
  }
};

// ตั้งเวลาแจ้งเตือนและควบคุมอุปกรณ์ตามวันในสัปดาห์
const scheduleTimerNotifications = async (deviceId, settings) => {
  try {
    // ยกเลิกการแจ้งเตือนเดิมก่อน
    await cancelTimerNotifications(deviceId);
    
    if (!settings.enabled) return;
    
    // แยกชั่วโมงและนาทีจากเวลาเปิด
    const [onHour, onMinute] = settings.onTime.split(':').map(Number);
    
    // แยกชั่วโมงและนาทีจากเวลาปิด
    const [offHour, offMinute] = settings.offTime.split(':').map(Number);
    
    // คำนวณเวลาถัดไปที่จะแจ้งเตือน
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
    
    // ตั้งเวลาแจ้งเตือนสำหรับแต่ละวันในสัปดาห์
    const weekdayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    
    // วนลูปสำหรับทุกวันในสัปดาห์ (7 วัน)
    for (let i = 0; i < 7; i++) {
      // ถ้าวันนั้นไม่ได้เปิดใช้งาน ให้ข้ามไป
      if (!settings.weekdays[i]) continue;
      
      // คำนวณจำนวนวันที่ต้องเพิ่มเพื่อไปถึงวันที่ต้องการ
      const daysToAdd = (i - currentDayOfWeek + 7) % 7;
      
      // สร้างวันที่สำหรับวันนั้น
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + daysToAdd);
      
      // ตั้งเวลาเปิดเครื่อง
      await scheduleNotification(
        `turn_on_${deviceId}_${i}`,
        `เครื่องฟอกอากาศจะเปิดอัตโนมัติ (วัน${weekdayNames[i]})`,
        `เครื่องฟอกอากาศจะเปิดตามเวลาที่คุณตั้งไว้`,
        {
          hour: onHour,
          minute: onMinute,
          weekday: i + 1, // แปลงเป็นรูปแบบที่ expo-notifications ใช้ (1-7 แทน 0-6)
        },
        { deviceId, action: 'turn_on' }
      );
      
      // ตั้งเวลาปิดเครื่อง
      await scheduleNotification(
        `turn_off_${deviceId}_${i}`,
        `เครื่องฟอกอากาศจะปิดอัตโนมัติ (วัน${weekdayNames[i]})`,
        `เครื่องฟอกอากาศจะปิดตามเวลาที่คุณตั้งไว้`,
        {
          hour: offHour,
          minute: offMinute,
          weekday: i + 1,
        },
        { deviceId, action: 'turn_off' }
      );
    }
  } catch (error) {
    console.error('Error scheduling timer notifications:', error);
  }
};

// ฟังก์ชันย่อยสำหรับการตั้งเวลาแจ้งเตือน
const scheduleNotification = async (identifier, title, body, timeSettings, data) => {
  try {
    // ยกเลิกการแจ้งเตือนเดิมที่มี identifier เดียวกัน (ถ้ามี)
    await Notifications.cancelScheduledNotificationAsync(identifier);
    
    // สร้าง trigger ตามการตั้งค่าเวลา
    const trigger = {
      hour: timeSettings.hour,
      minute: timeSettings.minute,
      repeats: true,
    };
    
    // ถ้ามีการระบุวัน ให้เพิ่มวันในสัปดาห์
    if (timeSettings.weekday !== undefined) {
      trigger.weekday = timeSettings.weekday;
    }
    
    // ตั้งเวลาแจ้งเตือน
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger,
      identifier,
    });
    
    console.log(`Scheduled notification: ${identifier}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// ยกเลิกการแจ้งเตือนทั้งหมดสำหรับอุปกรณ์
const cancelTimerNotifications = async (deviceId) => {
  try {
    // สร้างรายการ identifiers ที่จะยกเลิก
    const identifiers = [];
    
    // สร้าง identifiers สำหรับทุกวันในสัปดาห์
    for (let i = 0; i < 7; i++) {
      identifiers.push(`turn_on_${deviceId}_${i}`);
      identifiers.push(`turn_off_${deviceId}_${i}`);
    }
    
    // ยกเลิกการแจ้งเตือนทั้งหมด
    for (const identifier of identifiers) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    
    console.log(`Cancelled all notifications for device: ${deviceId}`);
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

// ตั้งค่า Notification Handler เพื่อจัดการกับการแจ้งเตือนเมื่อมีการเปิด/ปิดตามเวลา
export const handleTimerNotification = async (notification) => {
  try {
    const { deviceId, action } = notification.request.content.data;
    
    if (action === 'turn_on') {
      // เปิดเครื่อง
      await TuyaService.toggleAirPurifier(deviceId, true);
      console.log(`Auto turned ON device: ${deviceId}`);
    } else if (action === 'turn_off') {
      // ปิดเครื่อง
      await TuyaService.toggleAirPurifier(deviceId, false);
      console.log(`Auto turned OFF device: ${deviceId}`);
    }
  } catch (error) {
    console.error('Error handling timer notification:', error);
  }
};