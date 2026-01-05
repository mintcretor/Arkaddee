import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Image,
    Modal,
    Dimensions
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { uploadProfileImage } from '@/api/baseapi';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
// Helper function to parse date strings into local Date objects
const parseLocalDate = (dateString) => {
    if (!dateString) return new Date(); // Default to current date if no string

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        // Fallback for invalid date strings
        return new Date();
    }

    // This is the key change:
    // If the date string potentially has time/timezone info (like ISO 8601),
    // we want to ensure the date components (year, month, day) are extracted
    // based on the *local* interpretation of the date string, or if it's UTC,
    // we convert it to the local date components without changing the *day*.

    // A safer way to handle this is to treat all incoming date strings for birthdate
    // as representing a specific date (YYYY-MM-DD), and not worry about the time.
    // The Date constructor can be tricky with different string formats and timezones.

    // Better approach: create a Date object based on YYYY-MM-DD in local timezone
    // by manually extracting components if it's an ISO string, or directly
    // if it's already YYYY-MM-DD.

    let year, month, day;

    if (dateString.includes('T')) { // Likely an ISO string with time
        // Create a temporary Date object from the ISO string
        const tempDate = new Date(dateString);
        // Get the year, month, day based on the *local time* interpretation of that UTC date
        year = tempDate.getFullYear();
        month = tempDate.getMonth();
        day = tempDate.getDate();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { // YYYY-MM-DD format
        const parts = dateString.split('-').map(Number);
        year = parts[0];
        month = parts[1] - 1; // Month is 0-indexed
        day = parts[2];
    } else {
        // Fallback for other unexpected formats, treat as current date
        return new Date();
    }

    // Now, create a new Date object using these local components.
    // This will represent the date at 00:00:00 in the local timezone.
    return new Date(year, month, day);
};
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EditProfileScreen = () => {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.photoURL || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const colorScheme = useColorScheme();

    // Initializing selectedDate with parseLocalDate to ensure it's a valid Date object
    const [selectedDate, setSelectedDate] = useState(parseLocalDate(user?.birthDate));
    const { t, i18n } = useTranslation();

    const [formData, setFormData] = useState({
        username: user?.username || '',
        displayName: user?.displayName || '',
        email: user?.email || '',
        gender: user?.gender || '',
        // birthDate ควรเก็บเป็น string YYYY-MM-DD เพื่อส่งให้ API/DB
        birthDate: user?.birthDate || '',
    });

    // ข้อความแสดงความผิดพลาด
    const [errors, setErrors] = useState({});

    // ตัวเลือกเพศ
    const genderOptions = [
        { label: t('profile.male'), value: 'male' },
        { label: t('profile.female'), value: 'female' },
        { label: t('profile.notspecified'), value: 'other' }
    ];

    useEffect(() => {
        if (user?.photoURL) {
            setProfileImage(user.photoURL);
        }
        // ตั้งค่าวันที่เริ่มต้น หากมี user.birthDate
        if (user?.birthDate) {
            // ใช้ parseLocalDate เพื่อแปลง birthDate จาก string เป็น Date object
            const parsedDate = parseLocalDate(user.birthDate);
            setSelectedDate(parsedDate);
            // ตรวจสอบให้แน่ใจว่า formData.birthDate ถูกตั้งค่าด้วย string YYYY-MM-DD
            // ซึ่งควรจะมาจาก API หรือการแปลงที่ API ทำ
            // ถ้า API ส่ง ISO string มา, ให้แปลงเป็น YYYY-MM-DD ก่อนเก็บใน formData.birthDate
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            setFormData(prev => ({ ...prev, birthDate: `${year}-${month}-${day}` }));
        } else {
            setSelectedDate(new Date()); // ถ้าไม่มี ให้เป็นวันปัจจุบัน
            // Clear birthDate in formData if user?.birthDate is null/undefined
            setFormData(prev => ({ ...prev, birthDate: '' }));
        }
    }, [user]);

    // ฟังก์ชันเปลี่ยนค่าข้อมูล
    const handleChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });

        // ลบข้อความแสดงความผิดพลาดเมื่อผู้ใช้แก้ไขข้อมูล
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: undefined,
            });
        }
    };

    // ฟังก์ชันเลือกเพศ
    const handleGenderSelect = (gender) => {
        handleChange('gender', gender);
    };

    // ฟังก์ชันสำหรับ iOS Modal DateTimePicker (onConfirm)
    const handleDateConfirm = (date) => {
        setSelectedDate(date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        handleChange('birthDate', dateString);
        setShowDatePicker(false);
    };

    // ฟังก์ชันสำหรับ Android DateTimePicker (onChange)
    const handleDateChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (date) {
            setSelectedDate(date);
            // สร้าง YYYY-MM-DD string จาก Date object ที่ได้รับจาก DatePicker
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            handleChange('birthDate', dateString); // บันทึก YYYY-MM-DD string
        }
    };

    // ฟังก์ชันจัดรูปแบบวันที่ตามภาษาที่เลือกใน i18n
    const formatLocalizedDate = (date) => {
        if (!date || isNaN(date.getTime())) {
            // If date is invalid, return a default value or empty string
            return t('profile.choosebirthdate');
        }

        const currentLanguage = i18n.language; // ดึงภาษาปัจจุบันของ i18n
        let options = { year: 'numeric', month: 'long', day: 'numeric' };
        let localeString = 'en-US'; // Default locale

        if (currentLanguage === 'th') {
            localeString = 'th-TH';
            // Removed calendar: 'buddhist' to keep Gregorian year
        } else if (currentLanguage === 'ja') {
            localeString = 'ja-JP';
        }
        // สามารถเพิ่มเงื่อนไขสำหรับภาษาอื่นๆ ได้ตามต้องการ

        try {
            return new Intl.DateTimeFormat(localeString, options).format(date);
        } catch (error) {
            console.error("Error formatting date with Intl.DateTimeFormat:", error);
            // Fallback to a simple format if Intl fails
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    };

    // ฟังก์ชันเปิด/ปิด date picker
    const toggleDatePicker = () => {
        if (Platform.OS === 'ios') {
            setShowDatePicker(!showDatePicker);
        } else {
            // Android show picker directly
            setShowDatePicker(true);
        }
    };

    // ฟังก์ชันขอสิทธิ์การเข้าถึงคลังรูปภาพ
    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.permission_required'), // ใช้ t() สำหรับข้อความแจ้งเตือน
                t('common.gallery_permission_message')
            );
            return false;
        }
        return true;
    };

    // ฟังก์ชันเลือกรูปจากคลังรูปภาพ
    const handlePickImage = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                handleUploadImage(selectedImage.uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert(t('common.error'), t('profile.cannot_select_image')); // ใช้ t()
        }
    };

    // ฟังก์ชันถ่ายรูป
    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.permission_required'), // ใช้ t()
                t('common.camera_permission_message') // ใช้ t()
            );
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                handleUploadImage(selectedImage.uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert(t('common.error'), t('profile.cannot_take_photo')); // ใช้ t()
        }
    };

    // ฟังก์ชันอัพโหลดรูปโปรไฟล์
    const handleUploadImage = async (uri) => {
        setImageUploading(true);
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            const fileSize = fileInfo.size / (1024 * 1024);

            if (fileSize > 20) {
                Alert.alert(t('profile.file_too_large_title'), t('profile.file_too_large_message')); // ใช้ t()
                setImageUploading(false);
                return;
            }

            if (!user) {
                Alert.alert(t('common.error'), t('profile.login_required_upload')); // ใช้ t()
                setImageUploading(false);
                return;
            }

            const response = await uploadProfileImage(uri);

            if (response.status === 'success') {
                setProfileImage(response.data.url);

                if (updateUserProfile) {
                    const updateResult = await updateUserProfile({
                        photoURL: response.data.url
                    });

                    if (!updateResult.success) {
                        console.warn('Failed to update profile in user context:', updateResult.message);
                    }
                }
                Alert.alert(t('common.success'), t('profile.updateimgSucess'));
            } else {
                throw new Error(response.message || t('profile.uploaderror'));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert(
                t('common.error'),
                t('profile.uploaderror')
            );
        } finally {
            setImageUploading(false);
        }
    };

    // แสดงตัวเลือกการเปลี่ยนรูปโปรไฟล์
    const showPhotoOptions = () => {
        Alert.alert(
            t('profile.change_profile_photo'), // ใช้ t()
            t('auth.choose_upload_method'), // ใช้ t()
            [
                {
                    text: t('store.take_photo'), // ใช้ t()
                    onPress: handleTakePhoto,
                },
                {
                    text: t('auth.choose_from_gallery'), // ใช้ t()
                    onPress: handlePickImage,
                },
                {
                    text: t('common.cancel'), // ใช้ t()
                    style: "cancel"
                }
            ]
        );
    };

    // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
    const validateForm = () => {
        const newErrors = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = t('profile.displayname_required'); // ใช้ t()
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = t('profile.email_required'); // ใช้ t()
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = t('profile.email_invalid_format'); // ใช้ t()
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ฟังก์ชันบันทึกข้อมูล
    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert(t('common.error'), t('common.checkerror'));
            return;
        }

        setLoading(true);

        try {
            const response = await updateUserProfile({
                displayName: formData.displayName,
                email: formData.email,
                gender: formData.gender,
                birthDate: formData.birthDate, // ส่งรูปแบบ YYYY-MM-DD ไปยัง API/DB
            });

            if (response.success) {
                Alert.alert(
                    t('common.success'),
                    t('profile.successfully_updated'), // ใช้ t()
                    [
                        {
                            text: t('common.ok'), // ใช้ t()
                            onPress: () => router.back()
                        }
                    ]
                );
            } else {
                Alert.alert(t('common.error'), t('common.update_failed')); // ใช้ t()
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert(t('common.error'), t('common.update_failed')); // ใช้ t()
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#fff"
                translucent={false}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
                <View style={styles.rightPlaceholder} />
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* รูปโปรไฟล์ */}
                    <View style={styles.profileImageSection}>
                        <View style={styles.profileImageContainer}>
                            {imageUploading ? (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator size="large" color="#007bff" />
                                </View>
                            ) : (
                                <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.8}>
                                    <Image
                                        source={{
                                            uri: profileImage || 'https://via.placeholder.com/120x120?text=No+Image'
                                        }}
                                        style={styles.profileImage}
                                    />
                                    <View style={styles.cameraIconContainer}>
                                        <Feather name="camera" size={16} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={showPhotoOptions} style={styles.changePhotoButton}>
                            <Text style={styles.changePhotoText}>{t('profile.ChangePhoto')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('auth.username')}</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={formData.username}
                                placeholder={t('auth.username_placeholder')}
                                placeholderTextColor="#999"
                                editable={false}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('profile.displayName')}</Text>
                            <TextInput
                                style={[styles.input, errors.displayName && styles.inputError]}
                                value={formData.displayName}
                                onChangeText={(text) => handleChange('displayName', text)}
                                placeholder={t('profile.displayname_placeholder')}
                                placeholderTextColor="#999"
                            />
                            {errors.displayName && (
                                <Text style={styles.errorText}>{errors.displayName}</Text>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('auth.email')}</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                placeholder={t('profile.email_placeholder')}
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            )}
                        </View>

                        {/* เพศ */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('profile.sex')}</Text>
                            <View style={styles.genderContainer}>
                                {genderOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.genderButton,
                                            formData.gender === option.value && styles.genderButtonActive
                                        ]}
                                        onPress={() => handleGenderSelect(option.value)}
                                    >
                                        <Text style={[
                                            styles.genderButtonText,
                                            formData.gender === option.value && styles.genderButtonTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* วันเกิด */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('profile.birthdate')}</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={toggleDatePicker}
                            >
                                <Text style={styles.datePickerText}>
                                    {formData.birthDate ? formatLocalizedDate(selectedDate) : t('profile.choosebirthdate')}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>


                    </View>

                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>{t('profile.save_data')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Picker */}
            {showDatePicker && (
                <>
                    {Platform.OS === 'ios' ? (
                        <Modal
                            visible={showDatePicker}
                            transparent
                            animationType="slide"
                            onRequestClose={() => setShowDatePicker(false)}
                        >
                            <View style={styles.modalOverlays}>
                                <View style={styles.iosDatePickerSheet}>
                                    {/* Header ส่วนนี้มี Padding ได้ปกติ */}
                                    <View style={styles.iosDatePickerHeader}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text style={styles.iosDatePickerCancel}>{t('common.cancel')}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.iosDatePickerTitle}>{t('profile.choosebirthdate')}</Text>
                                        <TouchableOpacity onPress={() => handleDateConfirm(selectedDate)}>
                                            <Text style={styles.iosDatePickerDone}>{t('common.save')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.iosDatePickerDivider} />

                                    {/* ตัว Picker วางไว้ตรงนี้ จะกว้างเท่าจอพอดีเพราะใช้ SCREEN_WIDTH */}
                                    <DateTimePicker
                                        value={selectedDate || new Date()}
                                        mode="date"
                                        display="spinner"
                                        onChange={handleDateChange}
                                        maximumDate={new Date()}
                                        minimumDate={new Date(1924, 0, 1)}
                                        locale={i18n.language === 'th' ? 'th-TH' : 'en-US'}
                                        textColor="#000000"
                                        style={styles.iosDateTimePicker}
                                        themeVariant="light"
                                    />
                                </View>
                            </View>
                        </Modal>
                    ) : (

                        <DateTimePicker
                            value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            minimumDate={new Date(1924, 0, 1)}
                            locale={i18n.language === 'th' ? 'th-TH' : 'en-US'} // ตั้งค่า locale ตามภาษาที่เลือก
                            style={styles.dateTimePicker}
                        />
                    )}
                </>
            )}
            {/* Bottom Button */}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        marginTop: Platform.OS === 'ios' ? 35 : 34, // ปรับถ้าจำเป็น

    },
    iosDatePickerSheet: {
        backgroundColor: 'white',
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },

    iosDatePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    iosDatePickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    iosDatePickerCancel: {
        fontSize: 16,
        color: '#007AFF',
    },
    iosDatePickerDone: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    iosDatePickerDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    iosDateTimePicker: {
        height: 260,
        width: SCREEN_WIDTH, // บังคับให้กว้างเท่าหน้าจอพอดี
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    rightPlaceholder: {
        width: 40,
    },
    scrollContent: {
        padding: 20,
    },
    profileImageSection: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f8f9fa',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007bff',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    uploadingContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(200, 200, 200, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changePhotoButton: {
        marginTop: 5,
    },
    changePhotoText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    inputDisabled: {
        backgroundColor: '#e9ecef',
        color: '#6c757d',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
        marginTop: 4,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        backgroundColor: '#f8f9fa',
    },
    genderButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    genderButtonText: {
        fontSize: 16,
        color: '#6c757d',
    },
    genderButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    datePickerButton: {
        height: 50,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlays: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#007bff',
    },
    modalDoneText: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    dateTimePicker: {
        height: 200,
        backgroundColor: '#fff',
    },
    bottomContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: Platform.OS === 'ios' ? 0 : 30,
    },
    cancelButton: {
        width: 100,
        marginRight: 15,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '500',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditProfileScreen;