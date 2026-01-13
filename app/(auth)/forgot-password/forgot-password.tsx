import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { set } from 'lodash';

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<boolean>(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');
  const [codeError, setCodeError] = useState<boolean>(false);
  const [VerifyCodeError, settVerifyCodeError] = useState<boolean>(false);
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSendCode = async () => {
    if (!email) {
      setEmailError(true);
      setEmailErrorMessage(t('auth.enterEmail'));
      return;
    }

    setIsLoading(true);

    try {
      // เช็คว่าอีเมลมีอยู่ในระบบหรือไม่
      const checkEmailResponse = await axios.post('https://api.arkaddee.com/api/auth/email', {
        email: email
      });

      // ถ้าตรวจสอบอีเมลผ่าน ส่ง OTP
      if (checkEmailResponse.data) {
        try {
          const otpResponse = await axios.post('https://email-api.thaibulksms.com/email/v1/otp/send', {
            template_uuid: '25051816-0908-87a0-bfbb-086473ff2ad1',
            recipient_email: email
          }, {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: 'Basic dTlxSzNtcHdqcHRUUnB0anQyME9sMzI0bDlfWlkyOmF5NzZfcnFMc2cxN2lPOEFBeFZpcFpOTG1BOTlPbg=='
            }
          });

          console.log(otpResponse.data);

          // เพิ่ม state variable สำหรับ token ในส่วน useState ด้านบน
          // const [token, setToken] = useState('');
          if (otpResponse.data.token) {
            setToken(otpResponse.data.token);
          }

          Alert.alert(t('auth.success'), t('auth.sendcode'));

        } catch (error) {
          console.log(error)
          //console.error('Error sending OTP:', error);
          setCodeError(true);

        }
      } else {
        setEmailErrorMessage(t('auth.donthaveEmail'));
        setEmailError(true);
        //Alert.alert(t('auth.error'), t('auth.donthaveEmail'));
      }
    } catch (error) {
      //console.error('Error checking email:', error);
      setEmailError(true);
      setEmailErrorMessage(t('auth.emailError'));
      //Alert.alert(t('auth.error'), t('auth.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !code) {
      setEmailError(!email);
      setEmailErrorMessage(t('auth.enterEmail'));
    }

    setIsLoading(true);

    try {
      // เปลี่ยน URL ด้านล่างเป็น API endpoint จริง
      const response = await axios.post('https://email-api.thaibulksms.com/email/v1/otp/verify', {
        token: token,
        otp_code: code
      }, {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: 'Basic dTlxSzNtcHdqcHRUUnB0anQyME9sMzI0bDlfWlkyOmF5NzZfcnFMc2cxN2lPOEFBeFZpcFpOTG1BOTlPbg=='
        }
      });

      console.log(response.data);
      if (response.data.status === 'verified') {
        // ส่งต่อข้อมูล email และ code ไปยังหน้า reset-password
        router.push({
          pathname: '/(auth)/reset-password/reset-password',
          params: { email, code }
        });
      } else {
        //Alert.alert('Error', t('auth.codeNotVerified'));
        //Alert.alert('Error', response.data.message || 'รหัสยืนยันไม่ถูกต้อง');
        settVerifyCodeError(true);
      }
    } catch (error) {
      settVerifyCodeError(true);
      //Alert.alert('Error', t('auth.codeNotVerified'));
      //console.error('Error verifying code:', error);
      //Alert.alert('Error', error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const OnchangeMail = (text: string) => {
    setCodeError(false);
    setEmailError(false);
    setEmailErrorMessage('');
    setEmail(text);
    setEmailError(!text);
  };

  const OnchangCode = (text: string) => {
    
    settVerifyCodeError(false);
    setCode(text);
    settVerifyCodeError(!text);
  } 

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.email')}</Text>
        <View style={[styles.emailInputContainer, emailError && { borderColor: 'red' }]}>
          <TextInput
            style={styles.input}
            value={email}
            placeholderTextColor="#999"
            placeholder={t('auth.enterEmail')}
            autoCapitalize="none"
            onChangeText={OnchangeMail}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendCode} disabled={isLoading}>
            <Text style={styles.sendButtonText}>{isLoading ? t('auth.sending') : t('auth.sent')}</Text>
          </TouchableOpacity>
        </View>
        {emailError && <Text style={{ color: 'red' }}>{emailErrorMessage}</Text>}
        {codeError && <Text style={{ color: 'red' }}>{t('auth.error')}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.verifycode')}</Text>
        <View style={[styles.emailInputContainer]}>
          <TextInput
            style={styles.input}
            placeholderTextColor="#999"
            placeholder={t('auth.enterCode')}
            value={code}
            onChangeText={OnchangCode}
          //editable={!isLoading}
          />
        </View>

        {VerifyCodeError && <Text style={{ color: 'red' }}>{t('auth.codeNotVerified')}</Text>}
      </View>

      <TouchableOpacity style={[styles.button, isLoading && styles.disabledButton]} onPress={handleSubmit} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? t('auth.processing') : t('auth.resetPassword')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login/login')}>
        <Text style={styles.loginText}>{t('auth.backtoLogin')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 150,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#333',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    color:"#000"
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  sendButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CD964',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 15,
    color: '#4CD964',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ForgotPasswordScreen;