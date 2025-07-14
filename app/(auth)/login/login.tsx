import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ImageSourcePropType,
    Alert,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession();

interface SocialButtonProps {
    icon: React.ReactNode;
    text: string;
    onPress: () => void;
    disabled?: boolean;
    type?: 'google' | 'apple' | 'guest';
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon, text, onPress, disabled }) => {
    const backgroundColor = '#ffffff';
    const textColor = '#000000';

    return (
        <TouchableOpacity
            style={[styles.socialButton, { backgroundColor }, disabled && styles.disabledButton]}
            onPress={onPress}
            disabled={disabled}
        >
            {icon}
            <Text style={[styles.socialButtonText, { color: textColor }]}>{text}</Text>
        </TouchableOpacity>
    );
};

const LoginScreen: React.FC = () => {
    const { signIn, signInWithSocial, signInAsGuest } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loadingVisible, setLoadingVisible] = useState(false); // Main loading state for overlay and button disable
    const [deviceId, setDeviceId] = useState<string>('');
    const [deviceIdAvailable, setDeviceIdAvailable] = useState<boolean>(true); // New state for guest login
    const [appleAuthAvailable, setAppleAuthAvailable] = useState<boolean>(false);
    const { t } = useTranslation();
    const [isRedirecting, setIsRedirecting] = useState(false); // Used to indicate a redirect is in progress (e.g., for Google Auth)

    // Field validation states
    const [usernameError, setUsernameError] = useState<boolean>(false);
    const [usernameFalse, setUsernameFalse] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<boolean>(false);
    const [passwordFalse, setPasswordFalse] = useState<boolean>(false);

    // Initialize Google Auth
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '975495478878-f7jeoh4sd97hgokbve2kfl00477gdauf.apps.googleusercontent.com',
        iosClientId: '975495478878-ufhbel65ud1876t4te1t0c5g7ls8ide5.apps.googleusercontent.com',
        expoClientId: '975495478878-lttle2i1tnsjlml5hed680g5o6c44kho.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        additionalParameters: {
            prompt: 'select_account', // บังคับเลือกบัญชีเสมอ
            access_type: 'offline',
        }
    });

    useEffect(() => {
        getDeviceId();
        checkAppleAuthAvailable();
    }, []);

    useEffect(() => {
        const checkPendingAuth = async () => {
            try {
                const pendingAuth = await AsyncStorage.getItem('auth_in_progress');
                if (pendingAuth === 'google') {
                    // console.log('Found pending Google auth, waiting for response...');
                    setLoadingVisible(true); // Show loading if a pending auth was detected
                    setIsRedirecting(true); // Indicate redirect is still expected
                    // Add a timeout to clear loading if no response comes back within a reasonable time
                    const timeoutId = setTimeout(async () => {
                        console.warn('Google auth response timed out, clearing loading state.');
                        setLoadingVisible(false);
                        setIsRedirecting(false);
                        await AsyncStorage.removeItem('auth_in_progress');
                    }, 15000); // 15 seconds timeout

                    // Return a cleanup function to clear the timeout if the effect re-runs or component unmounts
                    return () => clearTimeout(timeoutId);
                } else {
                    setLoadingVisible(false); // No pending login, hide loading
                    setIsRedirecting(false);
                }
            } catch (error) {
                console.error('Error checking pending auth:', error);
                setLoadingVisible(false);
                setIsRedirecting(false);
            }
        };

        checkPendingAuth();
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        handleGoogleResponse();
    }, [response]); // Only re-run when `response` changes

    const checkAppleAuthAvailable = async () => {
        if (Platform.OS === 'ios') {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            setAppleAuthAvailable(isAvailable);
        }
    };

    const handleGoogleResponse = async () => {
        if (!response) {
            return;
        }
        console.log('Google Auth Response Type:', response.type); // Log response type for debugging
        console.log('Google Auth Response Params:', response.params); // Log response params for debugging

        try {
            if (response.type === 'success') {
                setLoadingVisible(true); // Ensure loading is visible during processing

                if (!response.params?.id_token) {
                    console.error('No id_token received from Google');
                    Alert.alert('Error', 'Authentication failed. No token received.');
                    return; // Exit early
                }

                const authResponse = await signInWithSocial({
                    provider: 'google',
                    token: response.params.id_token,
                    manualNavigation: true
                });

                if (authResponse.success) {
                    await AsyncStorage.removeItem('auth_in_progress');
                    router.replace('/(tabs)/home'); // Navigate immediately
                } else {
                    Alert.alert('Login Failed', authResponse.message || 'Google login failed');
                }
            } else if (response.type === 'error') {
                console.error('Google auth error:', response.error);
                Alert.alert('Error', 'Google authentication failed');
            } else if (response.type === 'dismiss' || response.type === 'cancel') {
                console.log('Google auth dismissed/cancelled');
                // No alert needed for dismiss/cancel, just hide loading
            }
        } catch (error) {
            console.error('Error processing Google response:', error);
            Alert.alert('Error', 'Failed to process authentication');
        } finally {
            // Always hide loading and clear redirect state, and clear AsyncStorage flag
            setLoadingVisible(false);
            setIsRedirecting(false);
            await AsyncStorage.removeItem('auth_in_progress');
        }
    };

    const getDeviceId = async (): Promise<void> => {
        try {
            if (Platform.OS === 'ios') {
                const id = await Application.getIosIdForVendorAsync();
                setDeviceId(id || '');
            } else {
                const id = Application.getAndroidId();
                setDeviceId(id || '');
            }
            setDeviceIdAvailable(true); // Device ID fetched successfully
        } catch (error) {
            console.error('Error getting device ID:', error);
            setDeviceIdAvailable(false); // Indicate device ID is not available
        }
    };

    const validateUsername = (text: string) => {
        setUsernameError(false);
        setUsernameFalse(false);
        setUsername(text);
        setUsernameError(!text);
    };

    const validatePassword = (text: string) => {
        setPasswordError(false);
        setPasswordFalse(false);
        setPassword(text);
        setPasswordError(!text);
    };

    const handleLogin = async (): Promise<void> => {
        // Validate fields
        const usernameIsValid = !!username;
        const passwordIsValid = !!password;

        setUsernameError(!usernameIsValid);
        setPasswordError(!passwordIsValid);

        if (!usernameIsValid || !passwordIsValid) {
            return;
        }

        setLoadingVisible(true); // Show loading overlay for traditional login
        try {
            const response = await signIn({ username, password });
            console.log('Login Username', username);

            if (!response.success) {
                // ตรวจสอบว่า Backend แจ้งว่าต้องยืนยัน OTP หรือไม่
                if (response.requireOTP && response.userId && response.phoneNumber) {
                    Alert.alert(
                        t('auth.verificationRequired'), // "ต้องยืนยันตัวตน"
                        response.message || t('auth.pleaseVerifyPhone'), // "กรุณายืนยันเบอร์โทรศัพท์ของคุณ"
                        [
                            {
                                text: t('common.ok'),
                                onPress: () => {
                                    // นำทางไปยังหน้า OTP Verification
                                    router.push({
                                        pathname: '/(auth)/verify-otp/VerifyOTPScreen',
                                        params: {
                                            tempUserId: response.userId,
                                            phoneNumber: response.phoneNumber,
                                            username: username, // ส่ง username ไปด้วยเผื่อใช้แสดงผล
                                            password: password, // <--- สำคัญ: ส่ง password ที่ผู้ใช้เพิ่งกรอกไปให้หน้า OTP ด้วย
                                            fromLogin: 'true', // เพิ่ม flag เพื่อบอกว่ามาจากหน้า Login
                                            //fromSignUp: 'false', // เพิ่ม flag เพื่อบอกว่ามาจากหน้า Login
                                            expiresIn: 0 // เวลาหมดอายุ OTP
                                        },
                                    });
                                },
                            },
                        ]
                    );
                } else {
                    // กรณีที่ไม่สำเร็จอื่นๆ (เช่น username/password ไม่ถูกต้อง)
                    setUsernameFalse(!response.success);
                    setPasswordFalse(!response.success);
                    Alert.alert(
                        t('auth.loginFailed'),
                        response.message || t('auth.checkCredentials')
                    );
                }
            } else {
                // ล็อกอินสำเร็จ
                router.replace('/(tabs)/home');
            }
        } catch (error) {
            //   console.error('Login error:', error);
            Alert.alert(
                t('auth.loginFailed'),
                t('auth.checkCredentials')
            );
        } finally {
            setLoadingVisible(false);
        }
    };

    const handleForgotPassword = (): void => {
        router.push('/(auth)/forgot-password/forgot-password');
    };

    const handleSignUp = (): void => {
        router.push('/(auth)/register/register');
    };

    const handleGoogleLogin = async (): Promise<void> => {
        try {
            setIsRedirecting(true);
            setLoadingVisible(true); // Show loading overlay
            await AsyncStorage.setItem('auth_in_progress', 'google');

            if (!request) {
                console.error('Google auth request not ready');
                Alert.alert('Error', 'Google authentication is not ready. Please try again.');
                setLoadingVisible(false); // Hide loading here if request is not ready
                setIsRedirecting(false);
                await AsyncStorage.removeItem('auth_in_progress');
                return;
            }

            // promptAsync will open the browser. Its promise resolves when the browser is closed/redirected.
            const authResult = await promptAsync({
                showInRecents: false,
                dismissButtonStyle: 'cancel',
            });

            // This block handles immediate resolution from promptAsync itself.
            // This is crucial for cases where the user dismisses the browser directly.
            if (authResult.type === 'dismiss' || authResult.type === 'cancel' || authResult.type === 'error') {
                console.log(`Google auth flow ended with type: ${authResult.type}. Clearing loading state.`);
                setLoadingVisible(false);
                setIsRedirecting(false);
                await AsyncStorage.removeItem('auth_in_progress');
                // No need to alert here, as handleGoogleResponse (triggered by `response` useEffect)
                // will handle specific error/dismiss messages if the `response` object also updates.
                // This is a fail-safe to ensure loading is hidden.
            }
            // If authResult.type is 'success', the `response` useEffect will handle it.

        } catch (error: any) {
            console.error('Google prompt error (outer catch):', error);
            Alert.alert('Error', `Google login failed: ${error.message}`);
            setLoadingVisible(false);
            setIsRedirecting(false);
            await AsyncStorage.removeItem('auth_in_progress');
        }
    };

    const handleAppleLogin = async (): Promise<void> => {
        try {
            setLoadingVisible(true); // Show loading overlay

            if (Platform.OS !== 'ios') {
                Alert.alert('ไม่พร้อมใช้งาน', 'Apple Sign In รองรับเฉพาะ iOS เท่านั้น');
                return;
            }

            if (!appleAuthAvailable) {
                Alert.alert('ไม่พร้อมใช้งาน', 'Apple Sign In ไม่พร้อมใช้งานบนอุปกรณ์นี้');
                return;
            }

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) {
                console.error('Missing identity token from Apple');
                Alert.alert('ข้อผิดพลาด', 'ไม่ได้รับข้อมูลการยืนยันตัวตนจาก Apple');
                return;
            }

            if (!credential.user) {
                console.error('Missing user identifier from Apple');
                Alert.alert('ข้อผิดพลาด', 'ไม่ได้รับรหัสผู้ใช้จาก Apple');
                return;
            }

            const response = await signInWithSocial({
                provider: 'apple',
                token: credential.identityToken,
                userIdentifier: credential.user,
                manualNavigation: true
            });

            if (response.success) {
                router.replace('/(tabs)/home'); // Navigate immediately
            } else {
                console.error('Apple login failed:', response.message);
                Alert.alert(
                    'ไม่สามารถเข้าสู่ระบบได้',
                    response.message || 'ไม่สามารถเข้าสู่ระบบด้วย Apple ID ได้ กรุณาลองใหม่อีกครั้ง'
                );
            }

        } catch (error: any) {
            console.error('Apple Sign In Error:', error);
            if (error.code === 'ERR_CANCELED') {
                // User canceled Apple Sign In - no alert needed
            } else if (error.code === 'ERR_INVALID_RESPONSE') {
                Alert.alert('ข้อผิดพลาด', 'ได้รับข้อมูลไม่ถูกต้องจาก Apple กรุณาลองใหม่อีกครั้ง');
            } else if (error.code === 'ERR_REQUEST_FAILED') {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Apple ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            } else {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบด้วย Apple ID ได้ กรุณาลองใหม่อีกครั้ง หรือใช้วิธีการเข้าสู่ระบบอื่น');
            }
        } finally {
            setLoadingVisible(false); // Hide loading overlay when process finishes or errors
        }
    };

    const handleGuestLogin = async (): Promise<void> => {
        if (!deviceId) {
            console.warn('No device ID available for guest login.');
            Alert.alert('Error', 'Could not get device ID. Please try again or restart the app.');
            return;
        }
        if (!deviceIdAvailable) {
            Alert.alert('Error', 'Device ID not available. Guest login is temporarily unavailable.');
            return;
        }

        setLoadingVisible(true); // Show loading overlay
        try {
            const response = await signInAsGuest(deviceId);

            if (response.success) {
                // console.log('Guest login successful, navigating to home...');
                router.replace('/(tabs)/home');
            } else {
                Alert.alert('Guest Login Failed', response.message || 'Could not login as guest');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            Alert.alert('Error', 'Guest login failed');
        } finally {
            setLoadingVisible(false);
        }
    };

    return (
        <>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.username')}</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    usernameError && styles.inputError,
                                    usernameFalse && styles.inputError
                                ]}
                                value={username}
                                placeholderTextColor="#999"
                                onChangeText={validateUsername}
                                placeholder={t('auth.enterUsername')}
                                autoCapitalize="none"
                                editable={!loadingVisible} // Use loadingVisible here
                            />
                            {usernameError && (
                                <Text style={styles.errorText}>{t('auth.enterUsername')}</Text>
                            )}
                            {usernameFalse && (
                                <Text style={styles.errorText}>{t('auth.usernameNotcorrect')}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <View style={[
                                styles.passwordContainer,
                                passwordError && styles.inputError,
                                passwordFalse && styles.inputError
                            ]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={password}
                                    placeholderTextColor="#999"
                                    onChangeText={validatePassword}
                                    secureTextEntry={!showPassword}
                                    placeholder={t('auth.enterPassword')}
                                    autoCapitalize="none"
                                    editable={!loadingVisible} // Use loadingVisible here
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                    disabled={loadingVisible} // Use loadingVisible here
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={24}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                            {passwordError && (
                                <Text style={styles.errorText}>{t('auth.enterPassword')}</Text>
                            )}
                            {passwordFalse && (
                                <Text style={styles.errorText}>{t('auth.Passwordnotcorrect')}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, loadingVisible && styles.disabledButton]} // Use loadingVisible
                            onPress={handleLogin}
                            disabled={loadingVisible} // Use loadingVisible
                        >
                            {loadingVisible ? ( // Use loadingVisible to show indicator
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.linkContainer}>
                            <TouchableOpacity onPress={handleForgotPassword} disabled={loadingVisible}>
                                <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSignUp} disabled={loadingVisible}>
                                <Text style={styles.signUp}>{t('auth.signup')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.separator}>
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>{t('auth.or')}</Text>
                            <View style={styles.separatorLine} />
                        </View>

                        <SocialButton
                            type="google"
                            icon={<Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.socialIcon} />}
                            text={t('auth.loginWithGoogle')}
                            onPress={handleGoogleLogin}
                            disabled={loadingVisible} // Use loadingVisible
                        />

                        {Platform.OS === 'ios' && appleAuthAvailable ? (
                            <SocialButton
                                type="apple"
                                icon={<Ionicons name="logo-apple" size={22} color="#000" />}
                                text={t('auth.loginWithApple')}
                                onPress={handleAppleLogin}
                                disabled={loadingVisible} // Use loadingVisible
                            />
                        ) : null}

                        <SocialButton
                            type="guest"
                            icon={<Ionicons name="person-outline" size={22} color="#000" />}
                            text={t('auth.loginAsGuest')}
                            onPress={handleGuestLogin}
                            disabled={loadingVisible || !deviceIdAvailable} // Use loadingVisible and deviceIdAvailable
                        />

                        <View style={styles.bottomPadding} />
                    </View>
                </View>

                <View style={styles.languageSelectorContainer}>
                    <LanguageSelector />
                </View>
            </ScrollView>

            {/* Loading Overlay */}
            {loadingVisible && (
                <View style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center'
                    }}>
                        <ActivityIndicator size="large" color="#4CD964" />
                        <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                            {t('common.loading')}...
                        </Text>
                    </View>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        flexGrow: 1,
        position: 'relative',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    formContainer: {
        width: '100%',
        top: -90,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 200,
        height: 200,
        top: -50,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
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
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        color:'#000',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff0000',
    },
    errorText: {
        color: '#ff0000',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
        color:'#000'
    },
    eyeIcon: {
        padding: 10,
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4CD964',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    forgotPassword: {
        color: '#666',
    },
    signUp: {
        color: '#666',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#666',
        fontSize: 14,
    },
    socialButton: {
        width: '100%',
        height: 45,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginVertical: 5,
        backgroundColor: '#fff',
    },
    socialIcon: {
        width: 22,
        height: 22,
        marginRight: 10,
    },
    socialButtonText: {
        fontSize: 14,
        color: '#000',
    },
    disabledButton: {
        opacity: 0.7,
    },
    languageSelectorContainer: {
        position: 'absolute',
        bottom: 50,
        right: 5,
        zIndex: 1000,
        transform: [{ scale: 0.8 }]
    },
    bottomPadding: {
        height: 100, // Add some padding at the bottom for scrolling
    }
});

export default LoginScreen;
