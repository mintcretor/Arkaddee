// app/device-control.js หรือ app/device-control/index.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Switch,
    StatusBar,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    Modal,
    TouchableWithoutFeedback,
    AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchDeviceId, updateDeviceStatus } from '@/api/baseapi';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
//import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { useTranslation } from 'react-i18next';


export default function DeviceControlScreen() {
    const params = useLocalSearchParams();
    const { deviceId, productId, deviceName,is_primary } = params;
    const [valveStatus, setValveStatus] = useState(false);
    const [modeModalVisible, setModeModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false); // เพิ่ม state นี้
    const [device, setDevice] = useState(null);
    const [coolLevel, setCoolLevel] = useState('off');
    const [timerModalVisible, setTimerModalVisible] = useState(false);
    const [onTime, setOnTime] = useState('08:00');
    const [offTime, setOffTime] = useState('22:00');
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const [activeTimeSetting, setActiveTimeSetting] = useState('on'); // 'on' หรือ 'off'
    const [weekdays, setWeekdays] = useState([true, true, true, true, true, true, true]); // [อาทิตย์, จันทร์, อังคาร, พุธ, พฤหัส, ศุกร์, เสาร์]
    const { t } = useTranslation();
    const FILTER_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
    const [lastFilterReset, setLastFilterReset] = useState(Date.now()); // โหลดจาก AsyncStorage ถ้ามี

    const [resetFilterModalVisible, setResetFilterModalVisible] = useState(false);
    const [deviceStatus, setDeviceStatus] = useState({
        pwr: 0,
        mode: 0,
        pm25: 0,
        fan: 0,
        co2: 0,
        tvoc: 0,
        humidity: 0,
        temperature: 0,
        refill: 100
    });
    const getFilterLifePercent = () => {
        const elapsed = Date.now() - lastFilterReset;
        const percent = Math.max(0, 100 - (elapsed / FILTER_LIFETIME_MS) * 100);
        return Math.round(percent);
    };
    const intervalRef = useRef(null);

    const startAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Fetch ข้อมูลทันทีก่อนเริ่ม interval
        fetchDeviceStatus();

        intervalRef.current = setInterval(() => {
            if (!isUpdating) {
                fetchDeviceStatus();
            }
        }, 2000); // เพิ่มเวลาเป็น 2 วินาที เพื่อลดการเรียก API บ่อยเกินไป
    };


    const performDeviceUpdate = async (updateFunction) => {
        setIsUpdating(true);
        try {
            await updateFunction();
            // ลด delay ให้สั้นลงและให้ fetch ข้อมูลใหม่ทันที
            setTimeout(async () => {
                await fetchDeviceStatus(); // เรียก fetch ทันทีหลังจาก update
                setIsUpdating(false);
            }, 1000); // ลดจาก 2000 เป็น 1000ms
        } catch (error) {
            console.error('Error in device update:', error);
            setIsUpdating(false);
            // Fetch ข้อมูลใหม่แม้ว่าจะเกิด error เพื่อให้ได้ข้อมูลล่าสุด
            setTimeout(() => {
                fetchDeviceStatus();
            }, 500);
        }
    };


    const stopAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // กำหนดคุณภาพอากาศตามค่า PM2.5
    const getAirQuality = (pm25) => {
        if (pm25 <= 12) return { text: t('myhome.Excellent'), color: '#4ADE80' };
        if (pm25 <= 35.4) return { text: t('myhome.GOOD'), color: '#22C55E' };
        if (pm25 <= 55.4) return { text: t('myhome.MODERATE'), color: '#FBBF24' };
        if (pm25 <= 150.4) return { text: t('myhome.POOR'), color: '#F97316' };
        if (pm25 <= 250.4) return { text: t('myhome.VERYPOOR'), color: '#EF4444' };
        return { text: t('myhome.HAZARDOUS'), color: '#7F1D1D' };
    };

  
    const toggleWeekday = (index) => {
        const newWeekdays = [...weekdays];
        newWeekdays[index] = !newWeekdays[index];
        setWeekdays(newWeekdays);
    };


    const showTimePicker = (timeType) => {
        setActiveTimeSetting(timeType);
        setTimePickerVisible(true);
    };

    const handleTimeConfirm = (date) => {
        const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        //console.log('เลือกเวลา:', formattedTime, 'activeTimeSetting:', activeTimeSetting);
        if (activeTimeSetting === 'on') {
            setOnTime(formattedTime);
        } else {
            setOffTime(formattedTime);
        }
        setTimePickerVisible(false);
    };

    // โหลดข้อมูลอุปกรณ์และสถานะล่าสุด
    const loadDeviceData = async () => {
        try {
            // ใช้ loading เฉพาะครั้งแรกเท่านั้น
            if (deviceStatus.pwr === 0 && deviceStatus.pm25 === 0) {
                setIsLoading(true);
            }

            const devicedata = await fetchDeviceId(productId, deviceId);
            if (!devicedata || !devicedata.data) {
                throw new Error('Invalid device data');
            }

            const status = devicedata.data;

            if (status.temperature >= 100 && status.temperature < 1000) {
                status.temperature = status.temperature / 10;
            }

            setDeviceStatus({
                pwr: status.pwr,
                mode: status.mode,
                fan: status.fan,
                pm25: status.pm25,
                co2: status.co2,
                tvoc: status.tvoc,
                humidity: status.humidity,
                temperature: status.temperature,
                refill: status.refill
            });
        } catch (error) {
            Alert.alert(t('myhome.Error'), t('myhome.Errorno'));
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        loadDeviceData(); // โหลดข้อมูลครั้งแรก
        fetchDeviceStatus();
        startAutoRefresh();

        return () => {
            stopAutoRefresh();
      
        };
    }, [deviceId]);

    useEffect(() => {
        // หยุดการอัพเดทเมื่อแอปอยู่ในสถานะไม่ได้ใช้งาน
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                // แอปกลับมาอยู่ในสถานะใช้งาน
                fetchDeviceStatus(); // ดึงข้อมูลล่าสุดทันที
                startAutoRefresh(); // เริ่มการอัพเดทอัตโนมัติใหม่
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // แอปอยู่ในสถานะพื้นหลังหรือไม่ได้ใช้งาน
                stopAutoRefresh(); // หยุดการอัพเดทอัตโนมัติ
            }
        };

        // เพิ่ม event listener สำหรับสถานะแอป
      //  const subscription = AppState.addEventListener('change', handleAppStateChange);

        // ลบ event listener เมื่อ component unmount
        return () => {
            //subscription.remove();
        };
    }, []);

    const fetchDeviceStatus = async () => {
        try {
            // ถ้ากำลังอัพเดท ให้ข้ามการ fetch
            if (isUpdating) {
                return;
            }

            const devicedata = await fetchDeviceId(productId, deviceId);
            if (!devicedata || !devicedata.data) {
                console.warn('No device data received');
                return;
            }

            const status = devicedata.data;

            // ปรับปรุงการจัดการอุณหภูมิ
            let adjustedTemperature = status.temperature;
            if (status.temperature >= 100 && status.temperature < 1000) {
                adjustedTemperature = status.temperature / 10;
            }

            // ⭐ เพิ่มการอัปเดต state ที่ขาดหายไป
            setDeviceStatus(prevStatus => ({
                ...prevStatus,
                pwr: status.pwr ?? prevStatus.pwr,
                mode: status.mode ?? prevStatus.mode,
                fan: status.fan ?? prevStatus.fan,
                pm25: status.pm25 ?? prevStatus.pm25,
                co2: status.co2 ?? prevStatus.co2,
                tvoc: status.tvoc ?? prevStatus.tvoc,
                humidity: status.humidity ?? prevStatus.humidity,
                temperature: adjustedTemperature ?? prevStatus.temperature,
                refill: status.refill ?? prevStatus.refill
            }));

            // อัปเดต valve status ถ้ามีข้อมูล
            if (status.valve !== undefined) {
                setValveStatus(status.valve === 1);
            }

        } catch (error) {
            console.error('Error fetching device status:', error);
            // ไม่แสดง Alert ในการ fetch อัตโนมัติ เพื่อไม่ให้รบกวนผู้ใช้
        }
    };
    // สลับเปิด/ปิดอุปกรณ์
    const togglePower = () => {
        performDeviceUpdate(async () => {
            const newPwrValue = deviceStatus.pwr === 1 ? 0 : 1;

            // อัพเดต UI ทันที
            setDeviceStatus(prev => ({ ...prev, pwr: newPwrValue }));

            try {
                await updateDeviceStatus(productId, deviceId, {
                    pwr: newPwrValue
                });
            } catch (error) {
                // ถ้า error ให้ย้อนกลับ
                setDeviceStatus(prev => ({ ...prev, pwr: prev.pwr === 1 ? 0 : 1 }));
                Alert.alert(t('myhome.Error'), t('myhome.Errorno'));
                throw error; // ให้ performDeviceUpdate จัดการ
            }
        });
    };
    const changeMode = (newMode) => {
        performDeviceUpdate(async () => {
            setDeviceStatus(prev => ({ ...prev, mode: newMode }));
            setModeModalVisible(false);

            try {
                await updateDeviceStatus(productId, deviceId, {
                    mode: newMode
                });
            } catch (error) {
                setDeviceStatus(prev => ({ ...prev, mode: prev.mode }));
                Alert.alert(t('myhome.Error'), t('myhome.Errorno'));
                throw error;
            }
        });
    };

    const toggleValve = () => {
        performDeviceUpdate(async () => {
            const newValveValue = valveStatus ? 0 : 1;

            // อัพเดต UI ทันที
            setValveStatus(!valveStatus);

            try {
                await updateDeviceStatus(productId, deviceId, {
                    valve: newValveValue
                });

                console.log(`Valve status changed to: ${!valveStatus ? 'open' : 'closed'}`);
            } catch (error) {
                // ถ้า error ให้ย้อนกลับ
                setValveStatus(valveStatus);
                Alert.alert(t('myhome.Error'), t('myhome.Errorno'));
                throw error;
            }
        });
    };
    // แสดง modal ยืนยันการรีเซ็ตแผ่นกรอง
    const showResetFilterConfirmation = () => {
        setResetFilterModalVisible(true);
    };

    // รีเซ็ตแผ่นกรอง
    const resetFilter = () => {
        setResetFilterModalVisible(false);

        // บันทึกเวลาที่รีเซ็ต (เช่นใน AsyncStorage หรือ state)
        const now = Date.now();
        setLastFilterReset(now);
        // setDeviceStatus(prev => ({ ...prev, refill: 100 })); // อัปเดต UI ทันที

        Alert.alert('สำเร็จ', 'รีเซ็ตแผ่นกรองเรียบร้อยแล้ว');
    };

    const toggleCoolLevel = () => {
        performDeviceUpdate(async () => {
            const newSpeed = (deviceStatus.fan + 1) % 4;

            // อัพเดต UI ทันที
            setDeviceStatus(prev => ({ ...prev, fan: newSpeed }));
            setCoolLevel(newSpeed);

            try {
                await updateDeviceStatus(productId, deviceId, {
                    fan: newSpeed
                });
            } catch (error) {
                // ถ้า error ให้ย้อนกลับ
                setDeviceStatus(prev => ({ ...prev, fan: (prev.fan - 1 + 4) % 4 }));
                setCoolLevel((newSpeed - 1 + 4) % 4);
                Alert.alert(t('myhome.Error'), t('myhome.Errorno'));
                throw error;
            }
        });
    };

    const MemoizedSensorGrid = React.memo(() => (
        <View style={styles.sensorsGrid}>
            <View style={styles.sensorItem}>
                <Text style={styles.sensorTitle}>PM2.5</Text>
                <Text style={styles.sensorValue}>{deviceStatus.pm25}</Text>
                <Text style={styles.sensorUnit}>μg/m³</Text>
            </View>

            <View style={styles.sensorItem}>
                <Text style={styles.sensorTitle}>CO2</Text>
                <Text style={styles.sensorValue}>{deviceStatus.co2}</Text>
                <Text style={styles.sensorUnit}>ppm</Text>
            </View>

            <View style={styles.sensorItem}>
                <Text style={styles.sensorTitle}>Temp.</Text>
                <Text style={styles.sensorValue}>{deviceStatus.temperature}</Text>
                <Text style={styles.sensorUnit}>°C</Text>
            </View>

            <View style={styles.sensorItem}>
                <Text style={styles.sensorTitle}>R.H.</Text>
                <Text style={styles.sensorValue}>{deviceStatus.humidity}</Text>
                <Text style={styles.sensorUnit}>%</Text>
            </View>
        </View>
    ));

    const airQuality = getAirQuality(deviceStatus.pm25);
    const now = new Date();
    const days = [t('store.sunday'), t('store.monday'), t('store.tuesday'), t('store.wednesday'), t('store.thursday'), t('store.friday'), t('store.saturday')];

    const months = [t('myhome.JANUARY'), t('myhome.FEBRUARY'), t('myhome.MARCH'), t('myhome.APRIL'), t('myhome.MAY'), t('myhome.JUNE'), t('myhome.JULY'), t('myhome.AUGUST'), t('myhome.SEPTEMBER'), t('myhome.OCTOBER'), t('myhome.NOVEMBER'), t('myhome.DECEMBER')];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />


            <View style={styles.overlay}>
                {/* หัวข้อหน้าจอ */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{deviceName}</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* แผงข้อมูลหลัก */}
                <View style={styles.mainPanel}>
                    <View style={styles.mainPanel2}>
                        {/* ไอคอนอุปกรณ์ */}
                        <View style={styles.deviceIconContainer}>
                            <Ionicons name="bed-outline" size={36} color="#fff" />
                        </View>

                        {/* คุณภาพอากาศ */}
                        <Text style={styles.airQualityLabel}>{t('myhome.Indoor_air_quality')}</Text>
                        <Text style={[styles.airQualityValue, { color: airQuality.color }]}>
                            {airQuality.text}
                        </Text>

                        {/* ข้อมูลแผ่นกรอง */}

                        <View style={styles.filterInfoRow}>



                            <View>
                                {productId === 'Arkad_M&C' || productId === 'Arkad_PCM' ? (
                                    <View  style={styles.filterInfoItem}>
                                        <Text style={styles.filterInfoLabel}>{t('myhome.Filter_life')}</Text>
                                        <Text style={styles.filterInfoValue}>{getFilterLifePercent()}%</Text>
                                    </View>
                                ) : null}
                            </View>



                            <View style={styles.filterInfoItem}>
                                <Text style={styles.filterInfoLabel}>{dayName} {date} {monthName}</Text>
                            </View>
                            <View >
                                {productId === 'Arkad_M&C' || productId === 'Arkad_PCM' ? (
                                    <View style={styles.filterInfoItem}>
                                        <Text style={styles.filterInfoLabel}>{t('myhome.Filter_reset')}</Text>
                                        <TouchableOpacity onPress={showResetFilterConfirmation}>
                                            <Text style={styles.filterResetButton}>{t('myhome.reset')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}

                            </View>


                        </View>

                        {/* ข้อมูล VOC */}

                        <View style={styles.vocRow}>
                            <Text style={styles.vocLabel}>VOC: {deviceStatus.tvoc}</Text>

                        </View>

                        {/* ข้อมูลเซนเซอร์ */}
                        <MemoizedSensorGrid deviceStatus={deviceStatus} />

                    </View>
                    {/* ปุ่มควบคุม */}

                    <View >
                        {productId === 'Arkad_M&C' || productId === 'Arkad_PCM' ? (
                            <View style={styles.controlButtons}>
                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={() => setModeModalVisible(true)}
                                >
                                    <Ionicons
                                        name={deviceStatus.mode === 0 ? 'cog-outline' :deviceStatus.mode === 1 ? 'hand-left-outline' : 'time-outline'}
                                        size={24}
                                        color="#fff"
                                    />
                                    <Text style={styles.controlButtonLabel}>
                                        {deviceStatus.mode === 0
                                            ? t('myhome.Auto')
                                            : deviceStatus.mode === 1
                                                ? t('myhome.Manual')
                                                : t('myhome.Timming')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        valveStatus && styles.activeControlButton
                                    ]}
                                    onPress={toggleValve}
                                >
                                    <Image
                                        width={24}
                                        height={24}
                                        source={valveStatus ? require('@/assets/icons/valve-open.png') : require('@/assets/icons/valve-close.png')}
                                    />
                                    <Text style={styles.controlButtonLabel}>{t('myhome.Valve')} {valveStatus ? t('myhome.on') : t('myhome.off')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.powerButton,
                                        deviceStatus.pwr === 0 ? styles.powerButtonInactive : styles.powerButtonActive
                                    ]}
                                    onPress={togglePower}
                                >
                                    <Ionicons
                                        name="power"
                                        size={36}
                                        color={deviceStatus.pwr === 0 ? "#aaa" : "#fff"}
                                    />
                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        deviceStatus.fan !== 0 && styles.activeControlButton
                                    ]}
                                    onPress={toggleCoolLevel}
                                >
                                    <MaterialCommunityIcons name="fan" size={24} color="#fff" />
                                    <Text style={styles.controlButtonLabel}>
                                        {t('myhome.Fan')} {deviceStatus.fan !== 0 ? `(${deviceStatus.fan})` : ''}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={() => router.push({
                                        pathname: '/device-scan/editdevice',
                                        params: { deviceId: deviceId, deviceName: deviceName, productId: productId,is_primary:is_primary }
                                    })}
                                >
                                    <Ionicons name="settings" size={24} color="#fff" />
                                    <Text style={styles.controlButtonLabel}>{t('myhome.Setting')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>

            {/* Modal สำหรับเลือกโหมด */}
            <Modal
                transparent={true}
                visible={modeModalVisible}
                animationType="fade"
                onRequestClose={() => setModeModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModeModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modeSelectionContainer}>
                                <Text style={styles.modeSelectionTitle}>{t('myhome.device_actions')}</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.modeOption,
                                        deviceStatus.mode === 1 && styles.activeMode
                                    ]}
                                    onPress={() => changeMode(1)}
                                >
                                    <Ionicons name="hand-left-outline" size={24} color="#fff" />
                                    <Text style={styles.modeOptionText}>{t('myhome.Manual') || 'Manual'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modeOption,
                                        deviceStatus.mode === 0 && styles.activeMode
                                    ]}
                                    onPress={() => changeMode(0)}
                                >
                                    <Ionicons name="cog-outline" size={24} color="#fff" />
                                    <Text style={styles.modeOptionText}>{t('myhome.Auto') || 'Auto'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modeOption,
                                        deviceStatus.mode === 2 && styles.activeMode
                                    ]}
                                    onPress={() => changeMode(2)}
                                >
                                    <Ionicons name="time-outline" size={24} color="#fff" />
                                    <Text style={styles.modeOptionText}>{t('myhome.Timming') || 'Timming'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setModeModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Modal ยืนยันการรีเซ็ตแผ่นกรอง */}
            <Modal
                transparent={true}
                visible={resetFilterModalVisible}
                animationType="fade"
                onRequestClose={() => setResetFilterModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setResetFilterModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.confirmationContainer}>
                                <Text style={styles.confirmationTitle}>{t('myhome.Filter_reset')}</Text>
                                <Text style={styles.confirmationText}>
                                    {t('myhome.reset_filter_confirm') || 'Are you sure to reset filter life time?'}
                                </Text>

                                <View style={styles.confirmationButtons}>
                                    <TouchableOpacity
                                        style={[styles.confirmationButton, styles.noButton]}
                                        onPress={() => setResetFilterModalVisible(false)}
                                    >
                                        <Text style={styles.noButtonText}>{t('common.no')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.confirmationButton, styles.yesButton]}
                                        onPress={resetFilter}
                                    >
                                        <Text style={styles.yesButtonText}>{t('common.yes')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                transparent={true}
                visible={timerModalVisible}
                animationType="fade"
                onRequestClose={() => setTimerModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setTimerModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modeSelectionContainer}>
                                <Text style={styles.modeSelectionTitle}>{t('myhome.set_timer') || 'Set Device On/Off Timer'}</Text>

                                {/* สวิตช์เปิด-ปิดการตั้งเวลา */}
                                <View style={styles.timerSwitchRow}>
                                    <Text style={styles.timerLabel}>{t('myhome.enable_timer') || 'Enable Timer'}</Text>
                                    <Switch
                                        value={timerEnabled}
                                        onValueChange={(value) => setTimerEnabled(value)}
                                        trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                        thumbColor={timerEnabled ? "#22C55E" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                    />
                                </View>

                                {/* เวลาเปิดเครื่อง */}
                                <View style={styles.timerRow}>
                                    <Text style={styles.timerLabel}>{t('myhome.on_time') || 'On Time'}</Text>
                                    <TouchableOpacity
                                        style={styles.timeSelector}
                                        onPress={() => showTimePicker('on')}
                                    >
                                        <Text style={styles.timeText}>{onTime}</Text>
                                        <Ionicons name="time-outline" size={18} color="#ccc" />
                                    </TouchableOpacity>
                                </View>

                                {/* เวลาปิดเครื่อง */}
                                <View style={styles.timerRow}>
                                    <Text style={styles.timerLabel}>{t('myhome.off_time') || 'Off Time'}</Text>
                                    <TouchableOpacity
                                        style={styles.timeSelector}
                                        onPress={() => showTimePicker('off')}
                                    >
                                        <Text style={styles.timeText}>{offTime}</Text>
                                        <Ionicons name="time-outline" size={18} color="#ccc" />
                                    </TouchableOpacity>
                                </View>

                                {/* เลือกวันในสัปดาห์ */}
                                <Text style={styles.weekdaysTitle}>{t('myhome.select_days') || 'Select Active Days'}</Text>

                                {/* วันในสัปดาห์แบบ 2 คอลัมน์ */}
                                <View style={styles.weekdaysContainer}>
                                    <View style={styles.weekdaysColumn}>
                                        {/* วันจันทร์ถึงวันพฤหัสบดี */}
                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.monday')}</Text>
                                            <Switch
                                                value={weekdays[1]}
                                                onValueChange={() => toggleWeekday(1)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[1] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>

                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.tuesday')}</Text>
                                            <Switch
                                                value={weekdays[2]}
                                                onValueChange={() => toggleWeekday(2)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[2] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>

                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.wednesday')}</Text>
                                            <Switch
                                                value={weekdays[3]}
                                                onValueChange={() => toggleWeekday(3)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[3] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>

                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.thursday')}</Text>
                                            <Switch
                                                value={weekdays[4]}
                                                onValueChange={() => toggleWeekday(4)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[4] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.weekdaysColumn}>
                                        {/* วันศุกร์ถึงวันอาทิตย์ */}
                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.friday')}</Text>
                                            <Switch
                                                value={weekdays[5]}
                                                onValueChange={() => toggleWeekday(5)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[5] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>

                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.saturday')}</Text>
                                            <Switch
                                                value={weekdays[6]}
                                                onValueChange={() => toggleWeekday(6)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[6] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>

                                        <View style={styles.weekdayRow}>
                                            <Text style={styles.weekdayLabel}>{t('store.sunday')}</Text>
                                            <Switch
                                                value={weekdays[0]}
                                                onValueChange={() => toggleWeekday(0)}
                                                trackColor={{ false: "#767577", true: "rgba(34, 197, 94, 0.4)" }}
                                                thumbColor={weekdays[0] ? "#22C55E" : "#f4f3f4"}
                                                ios_backgroundColor="#3e3e3e"
                                            />
                                        </View>
                                    </View>
                                </View>

                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            {/* วันศุกร์ถึงวันอาทิตย์                     
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleTimeConfirm}
                onCancel={() => setTimePickerVisible(false)}
                headerTextIOS={t('myhome.select_time') || "เลือกเวลา"}
                confirmTextIOS={t('common.confirm')}
                cancelTextIOS={t('common.cancel')}
            />
            */}    
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 16,
    },
    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingTop: StatusBar.currentHeight || 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    mainPanel: {
        margin: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(40, 40, 40, 0.8)',
        borderRadius: 16,
        alignItems: 'center',
    },
    mainPanel2: {
        padding: 20,
        paddingBottom: 0,
        alignItems: 'center',
    },
    deviceIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    airQualityLabel: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 4,
    },
    airQualityValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    filterInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 16,
        marginBottom: 16,
    },
    filterInfoItem: {
        alignItems: 'center',
    },
    filterInfoLabel: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 4,
    },
    filterInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterResetButton: {
        fontSize: 14,
        color: '#22C55E',
        fontWeight: 'bold',
    },
    vocRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 16,
        marginBottom: 16,
    },
    vocLabel: {
        fontSize: 14,
        color: '#ccc',
    },
    sensorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    sensorItem: {
        width: '48%',
        backgroundColor: 'rgba(60, 60, 60, 0.8)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    sensorTitle: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 4,
    },
    sensorValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    sensorUnit: {
        fontSize: 12,
        color: '#ccc',
        position: 'absolute',
        right: 12,
        bottom: 12,
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    controlButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    controlButtonLabel: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 4,
    },
    powerButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#22C55E',
    },
    powerButtonInactive: {
        backgroundColor: '#444',
    },
    powerButtonActive: {
        backgroundColor: '#22C55E',
    },
    activeControlButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeSelectionContainer: {
        width: '80%',
        backgroundColor: '#333',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    modeSelectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    modeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 10,
    },
    modeOptionText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
    activeMode: {
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
    },
    cancelButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#f44336',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Styles สำหรับ Modal ยืนยันการรีเซ็ตแผ่นกรอง
    confirmationContainer: {
        width: '80%',
        backgroundColor: '#333',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    confirmationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    confirmationText: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 20,
        textAlign: 'center',
    },
    confirmationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmationButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    noButton: {
        backgroundColor: '#444',
    },
    noButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    yesButton: {
        backgroundColor: '#22C55E',
    },
    yesButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    timerSwitchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    timerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    timerLabel: {
        fontSize: 16,
        color: '#fff',
    },
    timeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 60, 60, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 16,
        color: '#fff',
        marginRight: 8,
    },
    timerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    timerCancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: 'rgba(60, 60, 60, 0.8)',
    },
    timerSaveButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    weekdaysTitle: {
        fontSize: 16,
        color: '#fff',
        marginTop: 16,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    weekdaysContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    weekdaysColumn: {
        width: '40%', // กำหนดความกว้างของแต่ละคอลัมน์
    },
    weekdayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 0,
    },
    weekdayLabel: {
        fontSize: 14,
        color: '#fff',
    },
    weekdayButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(60, 60, 60, 0.8)',
        minWidth: 60,
        alignItems: 'center',
    },
    weekdayButtonActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
    },
    weekdayText: {
        fontSize: 14,
        color: '#ccc',
    },
    weekdayTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});