import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // รับค่า email และ code จาก params (ถ้ามีการส่งมาจากหน้า forgot password)
  const [email, setEmail] = useState(params.email as string || '');
  const [code, setCode] = useState(params.code as string || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { t } = useTranslation();

  // ตรวจสอบความแข็งแรงของรหัสผ่าน
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError(t('auth.passwordLength'));
      return false;
    }
    // เพิ่มเงื่อนไขอื่นๆ ตามต้องการ เช่น ต้องมีตัวเลข ตัวอักษรพิเศษ ฯลฯ
    setPasswordError('');
    return true;
  };

  const handleResetPassword = async () => {


    if (!validatePassword(newPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', t('auth.passwordnotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      // เปลี่ยน URL ด้านล่างเป็น API endpoint จริง
      const response = await axios.post('https://api.arkaddee.com/api/auth/reset-password', {
        email: email,
        password: confirmPassword
      });

      if (response.data.success) {
        Alert.alert(
          t('auth.success'),
          t('auth.passwordUpdated'),
          [
            {
              text:  t('auth.login'),
              onPress: () => router.push('/(auth)/login/login')
            }
          ]
        );
      } else {
        Alert.alert('Error', t('auth.cantUpdatePassword'));
      }
    } catch (error) {
      //console.error('Error resetting password:', error);
      Alert.alert('Error',t('auth.cantUpdatePassword'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            placeholder={t('auth.email')}
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            editable={!params.email} // ถ้ามีการส่ง email มาจากหน้าก่อนหน้า จะไม่ให้แก้ไข
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.verifycode')}</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder={t('auth.verifycode')}
            placeholderTextColor="#999"
            onChangeText={setCode}
            editable={!params.code} // ถ้ามีการส่ง code มาจากหน้าก่อนหน้า จะไม่ให้แก้ไข
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.newPassword')}</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            placeholder={t('auth.newPassword')}
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={(text) => {
              setNewPassword(text);
              validatePassword(text);
            }}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.confirmNewPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            placeholder={t('auth.confirmNewPassword')}
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={setConfirmPassword}
          />
          {newPassword !== confirmPassword && confirmPassword ? (
            <Text style={styles.errorText}>{t('auth.passwordnotMatch')}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ?  t('auth.processing') : t('auth.changePassword')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login/login')}>
          <Text style={styles.loginText}>{t('auth.backtoLogin')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 300,
    height: 200,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
    height: 50,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    color:'#000',
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 20,
    color: '#007BFF',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ResetPasswordScreen;