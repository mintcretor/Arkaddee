// แก้ไขใน SignUpScreen.tsx

// อัปเดต imports
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const SignUpScreen = () => {
    const router = useRouter();
    const { prepareSignUp } = useAuth(); // เปลี่ยนจาก signUp เป็น prepareSignUp
    const { t } = useTranslation();
    const errorMessageMap = {
        'This username is already taken. Please choose another one.': 'auth.usernameAlreadyUsed',
        'This email is already registered. Please use another email or log in.': 'auth.emailAlreadyUsed',
        'Username, email, password are required.': 'auth.requiredFields',
        'Registration completed': 'auth.registrationCompleted',
        // เพิ่ม mapping ตามข้อความจาก backend
    };
    function getTranslatedError(message: string) {
        const key = errorMessageMap[message];
        return key ? t(key) : message;
    }

    // Form values เหมือนเดิม
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Field-specific error states เหมือนเดิม
    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // General error message เหมือนเดิม
    const [generalError, setGeneralError] = useState('');

    // ฟังก์ชัน validation เหมือนเดิม (ไม่เปลี่ยน)
    const validateEmail = (text) => {
        setEmail(text);

        if (!text) {
            setEmailError(t('auth.enterEmail'));
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
            setEmailError(t('auth.invalidEmail'));
            return false;
        }

        setEmailError('');
        return true;
    };

    const validateUsername = (text) => {
        setUsername(text);

        if (!text) {
            setUsernameError(t('auth.enterUsername'));
            return false;
        }

        if (text.length < 3) {
            setUsernameError(t('auth.usernameMinLength'));
            return false;
        }

        setUsernameError('');
        return true;
    };

    const validatePhoneNumber = (text) => {
        //setPhoneNumber(text);

        //if (!text) {
        //    setPhoneError(t('auth.enterPhoneNumber'));
        //    return false;
        //}

        //const phoneRegex = /^0\d{9}$/;
        //if (!phoneRegex.test(text)) {
        //    setPhoneError(t('auth.invalidPhoneNumber'));
        //    return false;
        //}

        //setPhoneError('');
        return true;
    };

    const validatePassword = (text) => {
        setPassword(text);

        if (!text) {
            setPasswordError(t('auth.enterPassword'));
            return false;
        }

        if (text.length < 8) {
            setPasswordError(t('auth.passwordMinLength'));
            return false;
        }

        setPasswordError('');
        return true;
    };

    const validateConfirmPassword = (text) => {
        setConfirmPassword(text);

        if (!text) {
            setConfirmPasswordError(t('auth.enterConfirmPassword'));
            return false;
        }

        if (text !== password) {
            setConfirmPasswordError(t('auth.passwordsDoNotMatch'));
            return false;
        }

        setConfirmPasswordError('');
        return true;
    };

    const handleDisplayNameChange = (text) => {
        setDisplayName(text);
    };

    const validateForm = () => {
        // Reset general error
        setGeneralError('');

        // Validate all fields
        const isEmailValid = validateEmail(email);
        const isUsernameValid = validateUsername(username);
        // const isPhoneValid = validatePhoneNumber(phoneNumber);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

        return isEmailValid && isUsernameValid &&
            isPasswordValid && isConfirmPasswordValid;
    };

    // ✅ แก้ไขฟังก์ชัน handleSignUp ให้ใช้ prepareSignUp
    const handleSignUp = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // เปลี่ยนจาก signUp เป็น prepareSignUp
            const response = await prepareSignUp({
                username,
                email,
                password,
                displayName: displayName || username,
            });
            console.log('Prepare sign up response:', response);
            if (response.success) {
                // แสดงข้อความแจ้งเตือนความสำเร็จ

                Alert.alert(
                    t('auth.success'),
                    response.message || t('auth.loggedInSuccessfully'), // ข้อความจาก Backend หรือ Default
                    [{
                        text: t('common.ok'),
                        onPress: () => router.replace('/auth/login'), // นำทางไปหน้าหลัก
                    }]
                );
                /*Alert.alert(
                    'ส่งรหัสยืนยันสำเร็จ',
                    `ระบบได้ส่งรหัสยืนยันไปยังอีเมลล์ ${email} กรุณาตรวจสอบและกรอกรหัสเพื่อยืนยันตัวตนและสมัครสมาชิก`,
                    [
                        {
                            text: 'ตกลง',
                            onPress: () => {
                                // นำทางไปหน้ายืนยัน OTP พร้อมส่ง tempUserId
                                router.push({
                                    pathname: '/(auth)/verify-otp/VerifyOTPScreen',
                                    params: {
                                        tempUserId: response.tempUserId,
                                        fromSignUp: 'true', // บอกว่ามาจากหน้าสมัครสมาชิก
                                        username: username, // ส่งไปเพื่อแสดงข้อมูลในหน้า OTP
                                        expiresIn: response.expiresIn || 300 // เวลาหมดอายุ OTP
                                    }
                                });
                            }
                        }
                    ]
                );*/
            } else {
                // แสดงข้อความผิดพลาด
                setGeneralError(getTranslatedError(response.message) || t('auth.cannotSendVerification'));
            }
        } catch (error) {
            console.error('Prepare sign up error:', error);
            setGeneralError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    // ส่วน return และ styles เหมือนเดิม แต่เปลี่ยนข้อความปุ่มให้เหมาะสม
    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
                <View style={styles.formContainer}>
                    <Text style={styles.headerText}>{t('auth.signup')}</Text>

                    {generalError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.generalErrorText}>{generalError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.email')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                emailError ? styles.inputError : null
                            ]}
                            value={email}
                            placeholder={t('auth.enterEmail')}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={validateEmail}
                        />
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.username')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                usernameError ? styles.inputError : null
                            ]}
                            placeholder={t('auth.enterUsername')}
                            value={username}
                            autoCapitalize="none"
                            onChangeText={validateUsername}
                        />
                        {usernameError ? (
                            <Text style={styles.errorText}>{usernameError}</Text>
                        ) : null}
                    </View>

                    {/*}<View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.phone_number')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                phoneError ? styles.inputError : null
                            ]}
                            placeholder={t('auth.enterPhoneNumber')}
                            value={phoneNumber}
                            keyboardType="phone-pad"
                            onChangeText={validatePhoneNumber}
                            maxLength={10}
                        />
                        {phoneError ? (
                            <Text style={styles.errorText}>{phoneError}</Text>
                        ) : null}
                    </View>*/}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.displayname')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('auth.enterDisplayName')}
                            value={displayName}
                            onChangeText={handleDisplayNameChange}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.password')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                passwordError ? styles.inputError : null
                            ]}
                            placeholder={t('auth.enterPassword')}
                            secureTextEntry
                            value={password}
                            onChangeText={validatePassword}
                        />
                        {passwordError ? (
                            <Text style={styles.errorText}>{passwordError}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                confirmPasswordError ? styles.inputError : null
                            ]}
                            placeholder={t('auth.enterConfirmPassword')}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={validateConfirmPassword}
                        />
                        {confirmPasswordError ? (
                            <Text style={styles.errorText}>{confirmPasswordError}</Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {t('auth.signup')} {/* เปลี่ยนข้อความปุ่ม */}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginTextContainer}
                        onPress={() => router.push('/(auth)/login/login')}
                    >
                        <Text style={styles.loginText}>{t('auth.already')}</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

// styles เหมือนเดิม
const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    formContainer: {
        width: '100%',
        marginTop: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: '#333',
        fontSize: 16,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff3b30',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 14,
        marginTop: 5,
        marginLeft: 5,
    },
    errorContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#ffeeee',
        borderRadius: 10,
        marginBottom: 15,
    },
    generalErrorText: {
        color: '#ff3b30',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        height: 50,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginTextContainer: {
        marginTop: 15,
        marginBottom: 30,
        alignItems: 'center',
    },
    loginText: {
        color: '#4CAF50',
        fontSize: 16,
    },
    languageSelectorContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 1000,
    }
});

export default SignUpScreen;