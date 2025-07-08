import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard // Import Keyboard for dismiss
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// กำหนด Base URL สำหรับ API (API_URL ควรมาจาก config/index.ts)
const API_URL = 'https://api.arkaddee.com/api'; // ควรมาจาก config

const VerifyOTPScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn, verifyOTPAndCompleteSignUp, resendOTP } = useAuth(); // resendOTP ใน useAuth น่าจะถูกปรับให้รองรับ userId/phoneNumber ได้ด้วย
  const { t } = useTranslation();

  // รับค่าจาก params อย่างแม่นยำ
  const phoneNumber = typeof params.phoneNumber === 'string' ? params.phoneNumber : '';
  const userIdFromParams = typeof params.userId === 'string' ? params.userId : ''; // userId ที่ Backend ส่งมา
  const tempUserIdFromSignUp = typeof params.tempUserId === 'string' ? params.tempUserId : ''; // userId ที่ใช้ระหว่าง prepareSignUp

  // Flag และข้อมูลเพิ่มเติมจาก params
  const fromSignUp = typeof params.fromSignUp === 'string' ? params.fromSignUp === 'true' : false;
  const fromLogin = typeof params.fromLogin === 'string' ? params.fromLogin === 'true' : false;
  const username = typeof params.username === 'string' ? params.username : '';
  const password = typeof params.password === 'string' ? params.password : ''; // รับ password

  const expiresIn = typeof params.expiresIn === 'string' ? parseInt(params.expiresIn) : 60; // Default 60 seconds
  console.log('Params:', fromSignUp); // สำหรับดีบัก
  // กำหนด ID ที่จะใช้ในการส่ง API (สำคัญมาก)
  // ถ้ามาจาก signup flow ให้ใช้ tempUserIdFromSignUp
  // ถ้ามาจาก login flow ให้ใช้ userIdFromParams
  // ให้แน่ใจว่าทั้งคู่คือ User ID ที่ Backend สร้างให้ในขั้นตอน prepareSignUp หรือถูกส่งกลับมาตอน login
  const targetUserId = tempUserIdFromSignUp;
  console.log('Target User ID:', targetUserId); // สำหรับดีบัก
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(expiresIn);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // ตั้งเวลานับถอยหลังสำหรับการขอรหัส OTP ใหม่
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        setTimeRemaining(prev => prev - 1);
      } else {
        setIsResendDisabled(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // จัดรูปแบบเบอร์โทรศัพท์ให้อ่านง่าย
  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    }
    return phone;
  };

  // ส่งคำขอรหัส OTP ใหม่
  const handleResendOTP = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // ใช้ resendOTP จาก useAuth สำหรับทั้งสอง flow
      // สมมติว่า resendOTP ใน useAuth ถูกปรับให้รับ userId และ phoneNumber
      const response = await resendOTP(targetUserId, phoneNumber); // <--- ควรปรับ useAuth.resendOTP ให้รับแบบนี้

      if (response.success) {
        setTimeRemaining(response.expiresIn || 60); // ใช้ expiresIn จาก response
        setIsResendDisabled(true);
        setOtp(['', '', '', '', '', '']); // ล้างรหัสเก่า
        Alert.alert(t('auth.success'), t('auth.otpResentSuccess'));
      } else {
        setErrorMessage(response.message || t('auth.otpResendFailed'));
        Alert.alert(t('auth.error'), response.message || t('auth.otpResendFailed'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setErrorMessage(t('auth.networkError'));
      Alert.alert(t('auth.error'), t('auth.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // ตรวจสอบรหัส OTP และดำเนินการสมัคร/ล็อกอินให้เสร็จสมบูรณ์
  const handleVerifyOTP = async () => { // เปลี่ยนชื่อจาก verifyOTP เป็น handleVerifyOTP เพื่อความสอดคล้อง
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setErrorMessage(t('auth.enterFullOtp')); // กรุณากรอกรหัส OTP ให้ครบ 6 หลัก
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    Keyboard.dismiss();

    try {
      // ใช้ verifyOTPAndCompleteSignUp สำหรับทั้ง SignUp และ Login flow
      console.log('Verifying OTP:', { otpCode, targetUserId, phoneNumber, password });
      const response = await verifyOTPAndCompleteSignUp({
        otp: otpCode,
        tempUserId: targetUserId, // Backend คาดหวัง userId
        phoneNumber: phoneNumber,
        password: password, // <--- ส่ง password ไปด้วย
      });

      console.log('Verify OTP and Complete SignUp response:', response);

      if (response.success) {
        setIsLoading(false);
        // ไม่ต้องมี Alert แยก ถ้าต้องการแค่ navigate
        // แต่ถ้าจะแสดง Alert ก็แสดงได้เลย
        Alert.alert(
          t('auth.success'),
          response.message || t('auth.loggedInSuccessfully'), // ข้อความจาก Backend หรือ Default
          [{
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)/home'), // นำทางไปหน้าหลัก
          }]
        );
      } else {
        setIsLoading(false);
        setErrorMessage(response.message || t('auth.otpVerificationFailed'));
        Alert.alert(t('auth.otpVerificationFailed'), response.message || t('auth.pleaseTryAgain'));
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error during OTP verification:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || t('auth.otpVerificationFailed');
        setErrorMessage(errorMessage);
        Alert.alert(t('auth.error'), errorMessage);
      } else {
        setErrorMessage(t('auth.networkError'));
        Alert.alert(t('auth.error'), t('auth.networkError'));
      }
    }
  };

  // จัดการการเปลี่ยนตำแหน่งเมื่อกรอกตัวเลข
  const handleOtpChange = (text: string, index: number) => {
    // ... (logic เดิม)
    const digit = text.replace(/[^0-9]/g, '');

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (errorMessage) setErrorMessage('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // จัดการการลบข้อมูล
  const handleKeyPress = (e: any, index: number) => {
    // ... (logic เดิม)
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ฟังก์ชันจัดการปุ่มกลับ
  const handleGoBack = () => {
    if (fromSignUp) { // ใช้ fromSignUp แทน isSignUpFlow เพื่อความชัดเจน
      Alert.alert(
        t('auth.cancelSignupTitle'), // ยกเลิกการสมัคร
        t('auth.cancelSignupMessage'), // คุณต้องการยกเลิกการสมัครสมาชิกหรือไม่?
        [
          { text: t('common.no'), style: 'cancel' }, // ไม่
          {
            text: t('common.yes'), // ใช่
            style: 'destructive',
            onPress: () => {
              router.replace('/(auth)/signup/SignUpScreen'); // กลับไปหน้า Signup
            }
          }
        ]
      );
    } else { // รวมถึงกรณี fromLogin หรือกรณีอื่นๆ ที่ไม่ได้มาจาก signup
      router.back(); // กลับไปหน้าก่อนหน้า (น่าจะเป็น Login Screen)
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {fromSignUp ? t('auth.verifyAndSignup') : t('auth.identity')} {/* ยืนยันและสมัครสมาชิก : ยืนยันตัวตน */}
        </Text>
        <Text style={styles.subtitle}>
          {fromSignUp
            ? t('auth.enterOtpSignup') // กรุณากรอกรหัสยืนยันเพื่อสมัครสมาชิกให้เสร็จสมบูรณ์
            : t('auth.enterOtp') // กรุณากรอกรหัสยืนยัน
          }
        </Text>
        <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>

        {username && ( // แสดง username ถ้ามี
          <Text style={styles.usernameText}>
            {t('auth.accountInfo', { username: username })} {/* ใช้ interpolation */}
          </Text>
        )}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                errorMessage && styles.otpInputError
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              ref={(ref) => (inputRefs.current[index] = ref)}
              selectionColor="#4CAF50"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOTP} // เปลี่ยนเป็น handleVerifyOTP
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {fromSignUp ? t('auth.confirmAndSignup') : t('auth.confirmOtp')} {/* ยืนยันและสมัครสมาชิก : ยืนยันรหัส */}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {fromSignUp ? t('auth.notReceiveCode') : t('auth.notreciveOtp')} {/* ไม่ได้รับรหัส? */}
          </Text>
          {isResendDisabled ? (
            <Text style={styles.timer}>
              {fromSignUp ? t('auth.resendIn') : t('auth.resend')} {timeRemaining} {t('auth.seconds')}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={isResendDisabled || isLoading}
            >
              <Text style={styles.resendButton}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Text style={styles.backButtonText}>

            {fromSignUp ? t('auth.backToSignupEdit') : t('auth.backToLogin')} {/* กลับไปแก้ไขข้อมูลการสมัคร : กลับไปยังหน้าลงทะเบียน */}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#ffeeee',
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  otpInputError: {
    borderColor: '#ff3b30',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  resendText: {
    color: '#666',
    marginRight: 5,
  },
  timer: {
    color: '#666',
  },
  resendButton: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 30,
  },
  backButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default VerifyOTPScreen;