// hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

// กำหนด Base URL สำหรับ API
const API_URL = 'https://api.arkaddee.com/api';

type User = {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  phone_number?: string;
  photoURL?: string;
  authType: 'local' | 'google' | 'apple' | 'guest';
};
interface GuestSignInParams {
  deviceId: string;
  manualNavigation?: boolean; // เพิ่มตัวเลือกให้ควบคุมการนำทางเอง
};
type AuthState = {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;  // เพิ่ม refresh token
  tokenExpiry: number | null;   // เพิ่มเวลาหมดอายุของ token
  isDeletingAccount?: boolean; // เพิ่มสถานะสำหรับการลบบัญชี
};

interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  message?: string;
  requireOTP?: boolean;   // <--- เพิ่มตัวนี้
  userId?: string;        // <--- เพิ่มตัวนี้
  phoneNumber?: string;   // <--- เพิ่มตัวนี้
  username?: string;      // <--- เพิ่มตัวนี้ (ถ้าคุณต้องการส่ง username จาก Login ไปยัง OTP Screen)
};

interface SignInParams {
  username: string;
  password: string;
};

interface SocialSignInParams {
  provider: 'google' | 'apple';
  token: string;
  userIdentifier?: string;
  manualNavigation?: boolean; // เพิ่มตัวเลือกให้ควบคุมการนำทางเอง
};
interface PrepareSignUpParams {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

interface PrepareSignUpResponse {
  success: boolean;
  tempUserId?: string;
  message?: string;
  token?: string; // เพิ่ม token ถ้าต้องการ
  refreshToken?: string; // เพิ่ม refresh token ถ้าต้องการ
  user?: User; // เพิ่ม user ถ้าต้องการ 
  expiresIn?: number; // เวลาหมดอายุของ OTP (วินาที)
}

interface VerifyOTPAndCompleteSignUpParams {
  otp: string;
  tempUserId: string;
  phoneNumber?: string; // เพิ่มพารามิเตอร์นี้เพื่อส่งเบอร์โทรศัพท์
  password?: string; // เพิ่มพารามิเตอร์นี้เพื่อส่งรหัสผ่าน (ถ้าต้องการ)
}

interface VerifyOTPAndCompleteSignUpResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  message?: string;
}

interface SignUpParams {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  displayName?: string;
};

interface UpdateProfileParams {
  birthDate: any;
  gender: undefined;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;  // เพิ่มพารามิเตอร์นี้
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (params: SignInParams) => Promise<AuthResponse>;
  signInWithSocial: (params: SocialSignInParams) => Promise<AuthResponse>;
  signInAsGuest: (params: string | GuestSignInParams) => Promise<AuthResponse>;
  signUp: (params: SignUpParams) => Promise<AuthResponse>;
  prepareSignUp: (params: PrepareSignUpParams) => Promise<PrepareSignUpResponse>;
  verifyOTPAndCompleteSignUp: (params: VerifyOTPAndCompleteSignUpParams) => Promise<VerifyOTPAndCompleteSignUpResponse>;
  resendOTP: (tempUserId: string, phone_number: string) => Promise<PrepareSignUpResponse>; // เพิ่ม
  signOut: () => Promise<void>;
  updateUserProfile: (params: UpdateProfileParams) => Promise<AuthResponse>;
  deleteAccount: () => Promise<void>; // เพิ่มฟังก์ชันลบบัญชี
  refreshUser: () => Promise<void>; // เพิ่ม refreshUser
};

const AuthContext = createContext<AuthContextType | null>(null);

// เพิ่มตัวแปรสำหรับเก็บ interceptor ID
let axiosRequestInterceptor: number;
let axiosResponseInterceptor: number;

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isSignedIn: false,
    token: null,
    refreshToken: null,
    tokenExpiry: null,
    user: null,
    isDeletingAccount: false, // กำหนดค่าเริ่มต้น
  });
  const { t } = useTranslation(); // ใช้ useTranslation เพื่อเข้าถึงฟังก์ชัน t
  const { clearRecentlyViewed } = useRecentlyViewed(); // เพิ่มตรงนี้

  // สถานะสำหรับควบคุมการนำทาง
  const [isSocialAuthInProgress, setIsSocialAuthInProgress] = useState(false);

  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);
  const socialAuthTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ฟังก์ชันตรวจสอบและถอดรหัส token
  const decodeToken = (token: string): any => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      const decodedToken = decodeToken(token);
      if (!decodedToken || !decodedToken.exp) {
        return true;
      }
      // หาก token จะหมดอายุภายใน 5 นาที ให้ถือว่าใกล้หมดอายุ
      const bufferTime = 5 * 60; // 5 นาที
      return decodedToken.exp < (Date.now() / 1000) + bufferTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  // ฟังก์ชันรีเฟรช token
  const refreshAuthToken = async (): Promise<boolean> => {
    console.log('Attempting to refresh token...');
    try {
      // ตรวจสอบว่ามี refresh token หรือไม่
      if (!state.refreshToken) {
        console.warn('No refresh token available');
        return false;
      }

      console.log('Refreshing token...');

      // เรียก API เพื่อรีเฟรช token
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: state.refreshToken
      });

      const { token, refreshToken } = response.data;

      if (token) {
        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        // บันทึก token และ refresh token ใหม่
        await Promise.all([
          AsyncStorage.setItem('userToken', token),
          AsyncStorage.setItem('refreshToken', refreshToken || state.refreshToken),
          AsyncStorage.setItem('tokenExpiry', tokenExpiry ? tokenExpiry.toString() : '')
        ]);

        // อัปเดต state
        setState({
          ...state,
          token,
          refreshToken: refreshToken || state.refreshToken,
          tokenExpiry
        });

        // อัปเดต axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        console.log('Token refreshed successfully');
        return true;
      } else {
        console.warn('Failed to refresh token');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  // ตั้งค่า axios interceptors
  const setupAxiosInterceptors = () => {
    // ลบ interceptors เดิม (ถ้ามี)
    if (axiosRequestInterceptor !== undefined) {
      axios.interceptors.request.eject(axiosRequestInterceptor);
    }
    if (axiosResponseInterceptor !== undefined) {
      axios.interceptors.response.eject(axiosResponseInterceptor);
    }

    // ตั้งค่า interceptor สำหรับคำขอ
    axiosRequestInterceptor = axios.interceptors.request.use(
      async (config) => {
        // ตรวจสอบว่าเป็นการเรียก API ที่ต้องการ token หรือไม่
        if (config.headers?.Authorization && state.token) {
          // ตรวจสอบว่า token ใกล้หมดอายุหรือไม่
          if (isTokenExpired(state.token)) {
            console.log('Token is about to expire, refreshing...');
            // ถ้าใช่ ลองรีเฟรช token ก่อน
            const refreshed = await refreshAuthToken();

            if (refreshed) {
              // ถ้ารีเฟรชสำเร็จ ใช้ token ใหม่
              config.headers.Authorization = `Bearer ${state.token}`;
              console.log('Using new token for request');
            } else {
              // ถ้ารีเฟรชไม่สำเร็จ ลงชื่อออก
              await signOut();
              return Promise.reject(new Error('Token expired and refresh failed'));
            }
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // ตั้งค่า interceptor สำหรับการตอบกลับ
    axiosResponseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (axios.isAxiosError(error) && error.response) {
          const originalRequest = error.config;

          // หากเป็นข้อผิดพลาด 401 (Unauthorized) และไม่ใช่คำขอรีเฟรช token
          /*if (error.response.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('auth/refresh-token')) {

            originalRequest._retry = true;

            try {
              console.log('Received 401, attempting to refresh token...');
              // ลองรีเฟรช token
              const refreshed = await refreshAuthToken();

              if (refreshed && originalRequest.headers) {
                // ถ้ารีเฟรชสำเร็จ ลองเรียก API อีกครั้ง
                originalRequest.headers['Authorization'] = `Bearer ${state.token}`;
                console.log('Retrying request with new token');
                return axios(originalRequest);
              }
            } catch (refreshError) {
              console.error('Error refreshing token in response interceptor:', refreshError);
            }

            // ถ้ารีเฟรชไม่สำเร็จ ลงชื่อออก
            await signOut();

            // แจ้งเตือนผู้ใช้ (หากอยู่ในหน้าที่ต้องล็อกอิน)
            if (state.isSignedIn) {
              setTimeout(() => {
                Alert.alert(
                  'เซสชันหมดอายุ',
                  'กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ',
                  [
                    {
                      text: 'ตกลง',
                      onPress: () => {
                        router.replace('/(auth)/login/login');
                      }
                    }
                  ]
                );
              }, 100);
            }
          }*/

          // จัดการกับข้อผิดพลาด 403 (Forbidden)
          if (error.response.status === 403 && originalRequest && !originalRequest._retry) {
            // หาก token ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง
            console.log('Received 403, checking if token related...');

            // สามารถเพิ่มเงื่อนไขเฉพาะสำหรับจัดการข้อผิดพลาด 403 ที่เกิดจาก token
            if (error.response.data?.message?.includes('token')) {
              await signOut();

              setTimeout(() => {
                Alert.alert(
                  t('common.Invalid_ses'),
                  t('common.login_agian'),
                  [
                    {
                      text: t('common.ok'),
                      onPress: () => {
                        router.replace('/(auth)/login/login');
                      }
                    }
                  ]
                );
              }, 100);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  };

  // ตรวจสอบสถานะการทำ Social Auth
  useEffect(() => {
    // ตรวจสอบสถานะล็อกอินเมื่อแอปเริ่มทำงาน
    loadStoredAuth();

    // Clear timeout when component unmounts
    return () => {
      if (socialAuthTimeoutRef.current) {
        clearTimeout(socialAuthTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // ตั้งค่า interceptors หลังจากโหลดข้อมูลล็อกอิน
    if (state.token) {
      setupAxiosInterceptors();
    }
  }, [state.token]);

  // แก้ไข useEffect สำหรับการนำทางอัตโนมัติ
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const isIndexScreen = segments.length === 0 || segments[0] === '';

    if (state.isLoading || isNavigating.current || isSocialAuthInProgress || isIndexScreen) {
      return;
    }

    // ✅ เพิ่มตรวจสอบ: ถ้าเพิ่งกด back ไม่ต้อง auto navigate
    const isBackNavigation = router.canGoBack();

    let timeoutId: string | number | NodeJS.Timeout | undefined;

    if (!state.isSignedIn && !inAuthGroup && segments.length > 0 && !isBackNavigation) {
      isNavigating.current = true;
      console.log("Navigating to login screen");
      router.replace('/(auth)/login/login');

      timeoutId = setTimeout(() => {
        isNavigating.current = false;
      }, 1500);
    } else if (state.isSignedIn && inAuthGroup) {
      isNavigating.current = true;
      console.log("Navigating to main screen");
     // router.replace('/(tabs)/home');

      timeoutId = setTimeout(() => {
        isNavigating.current = false;
      }, 2500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state.isSignedIn, state.isLoading, segments, isSocialAuthInProgress]);

  const loadStoredAuth = async () => {
    try {
      // โหลดข้อมูลล็อกอินที่บันทึกไว้ใน AsyncStorage
      const [token, refreshToken, tokenExpiryStr, userJson] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('refreshToken'),
        AsyncStorage.getItem('tokenExpiry'),
        AsyncStorage.getItem('user')
      ]);

      const tokenExpiry = tokenExpiryStr ? parseInt(tokenExpiryStr) : null;

      if (token && userJson) {
        // ตรวจสอบว่า token ใกล้หมดอายุหรือหมดอายุแล้วหรือไม่
        if (token && isTokenExpired(token) && refreshToken) {
          console.log('Token expired or about to expire, refreshing on startup');
          // รีเฟรช token อัตโนมัติ
          const refreshSuccess = await refreshAuthToken();

          if (!refreshSuccess) {
            // หากรีเฟรชไม่สำเร็จ ให้ถือว่าไม่ได้ล็อกอิน
            setState({
              isLoading: false,
              isSignedIn: false,
              token: null,
              refreshToken: null,
              tokenExpiry: null,
              user: null,
            });
            return;
          }
        } else {
          // ตั้งค่า axios header สำหรับการร้องขอ API ในอนาคต
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          setState({
            isLoading: false,
            isSignedIn: true,
            token,
            refreshToken,
            tokenExpiry,
            user: JSON.parse(userJson),
          });
        }
      } else {
        setState({
          isLoading: false,
          isSignedIn: false,
          token: null,
          refreshToken: null,
          tokenExpiry: null,
          user: null,
        });
      }
    } catch (error) {
      console.error('Failed to load authentication state', error);
      setState({
        isLoading: false,
        isSignedIn: false,
        token: null,
        refreshToken: null,
        tokenExpiry: null,
        user: null,
      });
    }
  };

  const storeAuthData = async (token: string, refreshToken: string | null, user: User) => {
    try {
      // ถอดรหัส token เพื่อดูเวลาหมดอายุ
      const decodedToken = decodeToken(token);
      const tokenExpiry = decodedToken ? decodedToken.exp : null;
      //const storagePromises = [
      AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('user', JSON.stringify(user))
      // ];
      const dddd = await AsyncStorage.getItem('userToken');
      console.log('wewerewrwe', dddd);
      // if (refreshToken) {
      //    storagePromises.push(AsyncStorage.setItem('refreshToken', refreshToken));
      // }

      // if (tokenExpiry) {
      //   storagePromises.push(AsyncStorage.setItem('tokenExpiry', tokenExpiry.toString()));
      //  }

      //  await Promise.all(storagePromises);

      // ตั้งค่า axios header สำหรับการร้องขอ API ในอนาคต
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const updateUserData = async (user: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const signUp = async (params: SignUpParams): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: params.username,
        email: params.email,
        phoneNumber: params.phoneNumber,
        password: params.password,
        displayName: params.displayName || params.username
      });

      const { token, refreshToken, user, requireOTP } = response.data;

      if (token && user) {
        await storeAuthData(token, refreshToken || null, user);

        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        // ในกรณีลงทะเบียน ถ้าต้องการยืนยัน OTP อาจจะยังไม่เซ็ต isSignedIn เป็น true ในทันที
        setState({
          isLoading: false,
          isSignedIn: !requireOTP, // ถ้าต้องใช้ OTP ยังไม่ถือว่าล็อกอินเสร็จสมบูรณ์
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        return {
          success: true,
          token,
          refreshToken,
          user,
          requireOTP
        };
      } else {
        return { success: false, message: 'Registration failed' };
      }
    } catch (error) {
      // console.error('Registration error:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Registration failed'
        };
      }
      return { success: false, message: 'Network error' };
    }
  };

  const clearAuthData = async () => {
    await Promise.all([
      AsyncStorage.removeItem('userToken'),
      AsyncStorage.removeItem('refreshToken'),
      AsyncStorage.removeItem('tokenExpiry'),
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('auth_in_progress')
    ]);
    delete axios.defaults.headers.common['Authorization'];
  };

  const prepareSignUp = async (params: PrepareSignUpParams): Promise<PrepareSignUpResponse> => {
    try {
      console.log('Preparing signup for:', params.username);

      const response = await axios.post(`${API_URL}/auth/prepare-signup`, {
        username: params.username,
        email: params.email,
        password: params.password,
        displayName: params.displayName || params.username
      });
      console.log('Prepare signup successful, tempUserId:', response.data);
      const { success, token, refreshToken, user, message } = response.data;

      if (success) {
        // console.log('Prepare signup successful, tempUserId:', user);
        await storeAuthData(token, refreshToken || null, user);

        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        // อัปเดต state - ตอนนี้ถือว่าล็อกอินสำเร็จแล้ว
        setState({
          isLoading: false,
          isSignedIn: true,
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        return {
          success: true,
          token,
          refreshToken,
          user,
          message: t('auth.signupSuccess'),
        };


      } else {
        return {
          success: false,
          message: t('auth.signupFailed'),
        };
      }
    } catch (error) {
      console.error('Prepare signup error:', error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'เกิดข้อผิดพลาดในการเตรียมสมัครสมาชิก';

        // จัดการข้อผิดพลาดเฉพาะ
        if (error.response.status === 409) {
          // Conflict - email หรือ username ซ้ำ
          return {
            success: false,
            message: errorMessage
          };
        } else if (error.response.status === 400) {
          // Bad request - ข้อมูลไม่ถูกต้อง
          return {
            success: false,
            message: errorMessage
          };
        }

        return {
          success: false,
          message: errorMessage
        };
      }

      return {
        success: false,
        message: 'เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง'
      };
    }
  };

  const verifyOTPAndCompleteSignUp = async (params: VerifyOTPAndCompleteSignUpParams): Promise<VerifyOTPAndCompleteSignUpResponse> => {
    try {
      console.log('Verifying OTP and completing signup:', params);

      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        otpCode: params.otp,
        userId: params.tempUserId,
        phoneNumber: params.phoneNumber, // ส่งเบอร์โทรศัพท์ไปด้วย
        password: params.password // ส่งรหัสผ่านไปด้วยถ้าต้องการ
      });
      console.log('OTP verification response:', response.data);
      const { success, token, refreshToken, user, message } = response.data;

      if (success && token && user) {
        console.log('OTP verification and signup successful');

        // บันทึกข้อมูลการล็อกอิน
        await storeAuthData(token, refreshToken || null, user);

        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        // อัปเดต state - ตอนนี้ถือว่าล็อกอินสำเร็จแล้ว
        setState({
          isLoading: false,
          isSignedIn: true,
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        return {
          success: true,
          token,
          refreshToken,
          user,
          message: t('auth.signupSuccess')
        };
      } else {
        return {
          success: false,
          message: t('auth.signupFailed')
        };
      }
    } catch (error) {
      console.error('Verify OTP and complete signup error:', error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'การยืนยันล้มเหลว';

        // จัดการข้อผิดพลาดเฉพาะ
        if (error.response.status === 400) {
          // Bad request - OTP ไม่ถูกต้องหรือหมดอายุ
          return {
            success: false,
            message: errorMessage
          };
        } else if (error.response.status === 404) {
          // Not found - ไม่พบข้อมูลชั่วคราว
          return {
            success: false,
            message: 'ข้อมูลการสมัครหมดอายุ กรุณาสมัครใหม่อีกครั้ง'
          };
        }

        return {
          success: false,
          message: errorMessage
        };
      }

      return {
        success: false,
        message: 'เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง'
      };
    }
  };

  const resendOTP = async (tempUserId: any, phone_number: any): Promise<PrepareSignUpResponse> => {
    try {
      console.log('Resending OTP for tempUserId:', tempUserId);

      const response = await axios.post(`${API_URL}/auth/otp/resend`, {
        userId: tempUserId,
        phoneNumber: phone_number // ส่งเบอร์โทรศัพท์ไปด้วย
      });

      const { success, message, expiresIn } = response.data;

      return {
        success,
        tempUserId, // ใช้ tempUserId เดิม
        message: message || (success ? 'ส่งรหัสยืนยันใหม่สำเร็จ' : 'ไม่สามารถส่งรหัสยืนยันใหม่ได้'),
        expiresIn: expiresIn || 300
      };
    } catch (error) {
      console.error('Resend OTP error:', error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'ไม่สามารถส่งรหัสยืนยันใหม่ได้'
        };
      }

      return {
        success: false,
        message: 'เกิดข้อผิดพลาดเครือข่าย'
      };
    }
  };
  const signIn = async (params: SignInParams): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: params.username,
        password: params.password,
      });

      // ดึงค่าทั้งหมดที่ Backend อาจส่งมา รวมถึง requireOTP, userId, phoneNumber
      const { token, refreshToken, user, success, message, requireOTP, userId: backendUserId, phoneNumber: backendPhoneNumber } = response.data;

      // กรณีที่ Backend ตอบกลับมาว่า success: true (ล็อกอินสำเร็จ)
      if (success && token && user) {
        await storeAuthData(token, refreshToken || null, user);
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;
        setState({
          isLoading: false,
          isSignedIn: true,
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        // ส่งค่าทั้งหมดที่จำเป็นกลับไป
        return { success: true, token, refreshToken, user, message: message || 'Login successful' };
      }
      // กรณีที่ Backend ตอบกลับมาว่า success: false (ล็อกอินไม่สำเร็จ)
      else {
        // ตรวจสอบว่า Backend แจ้งว่าต้องยืนยัน OTP หรือไม่
        if (!success && requireOTP && backendUserId && backendPhoneNumber) {
          return {
            success: false,
            message: message || 'Please verify your phone number to complete your registration.',
            requireOTP: true, // ส่ง flag นี้กลับไป
            userId: backendUserId, // ส่ง userId กลับไป
            phoneNumber: backendPhoneNumber, // ส่ง phoneNumber กลับไป
            // username ไม่จำเป็นต้องส่งกลับจาก signIn เพราะ LoginScreen มีอยู่แล้ว
          };
        } else {
          // กรณีล็อกอินไม่สำเร็จด้วยเหตุผลอื่น ๆ (เช่น รหัสผ่านผิด, ไม่มีผู้ใช้)
          return { success: false, message: message || 'Authentication failed' };
        }
      }
    } catch (error) {
      // console.error('Login error:', error);
      if (axios.isAxiosError(error) && error.response) {
        const { message: backendErrorMessage, requireOTP, userId, phoneNumber } = error.response.data || {};
        // ตรวจสอบว่า Error เป็นเพราะต้องยืนยัน OTP หรือไม่
        if (requireOTP && userId && phoneNumber) {
          return {
            success: false,
            message: backendErrorMessage || 'Please verify your phone number to complete your registration.',
            requireOTP: true,
            userId,
            phoneNumber,
          };
        } else {
          return {
            success: false,
            message: backendErrorMessage || 'Authentication failed'
          };
        }
      }
      return { success: false, message: 'Network error' };
    }
  };

  // แก้ไขฟังก์ชัน signInWithSocial เพื่อจัดการกับการนำทางได้ดีขึ้น
  const signInWithSocial = async (params: SocialSignInParams): Promise<AuthResponse> => {
    console.log(`Starting ${params.provider} sign in process...`);
    console.log("Sending request to:", `${API_URL}/auth/${params.provider}`);

    // ตั้งค่าป้องกันการนำทางอัตโนมัติ
    isNavigating.current = true;

    // ตั้งค่า state เพื่อบอกว่ากำลังทำ social auth
    setIsSocialAuthInProgress(true);

    try {
      // ตั้งค่าเพื่อบอกว่ากำลัง login ด้วย social
      await AsyncStorage.setItem('auth_in_progress', params.provider);

      // ตรวจสอบข้อมูลที่จำเป็นก่อนส่ง API
      if (!params.token) {
        console.error(`Missing token for ${params.provider} authentication`);
        throw new Error(`Missing token for ${params.provider} authentication`);
      }

      // สร้าง request body
      const requestBody: any = {
        token: params.token
      };

      // เพิ่ม userIdentifier สำหรับ Apple
      if (params.provider === 'apple' && params.userIdentifier) {
        requestBody.userIdentifier = params.userIdentifier;
      }

      console.log(`Calling ${params.provider} API...`);

      const response = await axios.post(`${API_URL}/auth/${params.provider}`, requestBody, {
        timeout: 30000, // เพิ่ม timeout 30 วินาที
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`${params.provider} API response received:`, {
        status: response.status,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user
      });

      const { token, refreshToken, user } = response.data;

      if (token && user) {
        console.log(`${params.provider} authentication successful`);

        await storeAuthData(token, refreshToken || null, user);

        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        setState({
          isLoading: false,
          isSignedIn: true,
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        // ถ้าเป็นการควบคุมการนำทางเอง ให้ไม่รีเซ็ต isNavigating และ isSocialAuthInProgress ทันที
        if (params.manualNavigation) {
          console.log("Manual navigation mode - leaving navigation flags set");

          // แต่ตั้ง timeout เพื่อรีเซ็ตค่าหลังจากผ่านไประยะหนึ่ง (5 วินาที)
          if (socialAuthTimeoutRef.current) {
            clearTimeout(socialAuthTimeoutRef.current);
          }

          socialAuthTimeoutRef.current = setTimeout(() => {
            console.log("Resetting navigation flags after timeout");
            isNavigating.current = false;
            setIsSocialAuthInProgress(false);
            AsyncStorage.removeItem('auth_in_progress');
          }, 5000);
        } else {
          // ถ้าเป็นการนำทางอัตโนมัติ ให้รีเซ็ตค่าหลังจากผ่านไประยะหนึ่ง (2 วินาที)
          setTimeout(() => {
            isNavigating.current = false;
            setIsSocialAuthInProgress(false);
            AsyncStorage.removeItem('auth_in_progress');
          }, 2000);
        }

        return { success: true, token, refreshToken, user };
      } else {
        console.error(`${params.provider} authentication failed: Missing token or user data`);

        // รีเซ็ตค่าทันทีในกรณีที่ไม่สำเร็จ
        isNavigating.current = false;
        setIsSocialAuthInProgress(false);
        AsyncStorage.removeItem('auth_in_progress');

        return {
          success: false,
          message: `${params.provider} authentication failed: Invalid response from server`
        };
      }
    } catch (error: any) {
      console.error(`${params.provider} authentication error:`, error);

      // รีเซ็ตค่าทันทีในกรณีที่เกิดข้อผิดพลาด
      isNavigating.current = false;
      setIsSocialAuthInProgress(false);
      AsyncStorage.removeItem('auth_in_progress');

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          console.error(`${params.provider} API Error:`, {
            status: error.response.status,
            data: error.response.data
          });

          const errorMessage = error.response.data?.message || `${params.provider} authentication failed`;

          if (error.response.status === 401) {
            return {
              success: false,
              message: 'การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง'
            };
          } else if (error.response.status === 400) {
            return {
              success: false,
              message: 'ข้อมูลการยืนยันตัวตนไม่ถูกต้อง'
            };
          } else if (error.response.status >= 500) {
            return {
              success: false,
              message: 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้งในภายหลัง'
            };
          }

          return {
            success: false,
            message: errorMessage
          };
        } else if (error.request) {
          // Network error
          console.error(`${params.provider} Network Error:`, error.request);
          return {
            success: false,
            message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
          };
        } else {
          // Something else happened
          console.error(`${params.provider} Request Error:`, error.message);
          return {
            success: false,
            message: `เกิดข้อผิดพลาดในการส่งคำขอ: ${error.message}`
          };
        }
      } else {
        // Non-axios error
        console.error(`${params.provider} Unknown Error:`, error);
        return {
          success: false,
          message: error.message || `${params.provider} authentication failed`
        };
      }
    }
  };

  const signInAsGuest = async (params: string | GuestSignInParams): Promise<AuthResponse> => {
    try {
      // ตั้งค่าป้องกันการนำทางอัตโนมัติ
      isNavigating.current = true;

      // เช็คว่า params เป็น string หรือ object
      const deviceId = typeof params === 'string' ? params : params.deviceId;
      const manualNavigation = typeof params === 'object' ? params.manualNavigation : false;

      // ตั้งค่าเพื่อบอกว่ากำลัง login
      await AsyncStorage.setItem('auth_in_progress', 'true');

      const response = await axios.post(`${API_URL}/auth/guest`, {
        deviceId,
      });
      // console.log("Guest login response:", response.data);
      const { token, refreshToken, user } = response.data;

      if (token && user) {
        await storeAuthData(token, refreshToken || null, user);

        // ถอดรหัส token เพื่อดูเวลาหมดอายุ
        const decodedToken = decodeToken(token);
        const tokenExpiry = decodedToken ? decodedToken.exp : null;

        setState({
          isLoading: false,
          isSignedIn: true,
          token,
          refreshToken: refreshToken || null,
          tokenExpiry,
          user,
        });

        // ถ้าเป็นการควบคุมการนำทางเอง ให้ไม่รีเซ็ต isNavigating ทันที
        if (manualNavigation) {
          // คงค่า isNavigating.current ไว้
          console.log("Manual navigation mode - leaving navigation flags set");

          // แต่ตั้ง timeout เพื่อรีเซ็ตค่าหลังจากผ่านไประยะหนึ่ง (5 วินาที)
          if (socialAuthTimeoutRef.current) {
            clearTimeout(socialAuthTimeoutRef.current);
          }

          socialAuthTimeoutRef.current = setTimeout(() => {
            console.log("Resetting navigation flags after timeout");
            isNavigating.current = false;
            AsyncStorage.removeItem('auth_in_progress');
          }, 5000);
        } else {
          // ถ้าเป็นการนำทางอัตโนมัติ ให้รีเซ็ตค่าหลังจากผ่านไประยะหนึ่ง (2 วินาที)
          setTimeout(() => {
            isNavigating.current = false;
            AsyncStorage.removeItem('auth_in_progress');
          }, 2000);
        }

        return { success: true, token, refreshToken, user };
      } else {
        // รีเซ็ตค่าทันทีในกรณีที่ไม่สำเร็จ
        isNavigating.current = false;
        AsyncStorage.removeItem('auth_in_progress');
        return { success: false, message: 'Guest authentication failed' };
      }
    } catch (error) {
      // รีเซ็ตค่าทันทีในกรณีที่เกิดข้อผิดพลาด
      isNavigating.current = false;
      AsyncStorage.removeItem('auth_in_progress');

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Guest authentication failed'
        };
      }
      return { success: false, message: 'Network error' };
    }
  };

  const updateUserProfile = async (params: UpdateProfileParams): Promise<AuthResponse> => {
    try {
      // ตรวจสอบว่ามีข้อมูลที่จะอัพเดทหรือไม่
      if (!params || Object.keys(params).length === 0) {
        console.warn('Failed to update profile in user context: No data provided for update');
        return { success: false, message: 'No data provided for update' };
      }

      // ตรวจสอบว่ามี token หรือไม่
      if (!state.token) {
        return { success: false, message: 'Authentication required' };
      }

      // ตรวจสอบว่า token ใกล้หมดอายุหรือไม่
      if (isTokenExpired(state.token) && state.refreshToken) {
        console.log('Token expired or about to expire, refreshing before profile update');
        const refreshed = await refreshAuthToken();
        if (!refreshed) {
          return { success: false, message: 'Authentication failed. Please login again.' };
        }
      }

      console.log('Updating profile with token:', state.token.substring(0, 10) + '...');
      console.log('Request params:', params);

      // สร้างข้อมูลที่จะส่งไป API
      const updateData = {
        ...(params.displayName !== undefined && { displayName: params.displayName }),
        ...(params.email !== undefined && { email: params.email }),
        ...(params.phoneNumber !== undefined && { mobile: params.phoneNumber }),
        ...(params.photoURL !== undefined && { photoURL: params.photoURL }),
        ...(params.gender !== undefined && { gender: params.gender }),
        ...(params.birthDate !== undefined && { birthDate: params.birthDate })

      };
      console.log('ddd', updateData)
      // ตรวจสอบว่ามีข้อมูลที่จะอัพเดทหรือไม่
      if (Object.keys(updateData).length === 0) {
        console.warn('No valid data to update');
        return { success: false, message: 'No valid data to update' };
      }
      console.log('UpdateProfile', updateData)
      // เรียก API เพื่ออัปเดตข้อมูลผู้ใช้
      const response = await axios({
        method: 'put',
        url: `${API_URL}/users/profile`,
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: updateData
      });

      const { user } = response.data;

      if (user) {
        console.log('Profile updated successfully:', user);
        // อัพเดตข้อมูลผู้ใช้ใน AsyncStorage และ state
        const updatedUser = {
          ...state.user,
          ...user,
          // เพิ่มการตรวจสอบว่ามีการอัพเดทรูปโปรไฟล์หรือไม่
          photoURL: params.photoURL || state.user?.photoURL
        };
        await updateUserData(updatedUser);

        setState({
          ...state,
          user: updatedUser,
        });

        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: 'Profile update failed' };
      }
    } catch (error) {
      console.error('Update profile error:', error);

      // ตรวจสอบว่าเป็นข้อผิดพลาด 401 (Unauthorized) หรือ 403 (Forbidden) หรือไม่
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        // ลองรีเฟรช token และเรียก API อีกครั้ง
        if (state.refreshToken) {
          try {
            console.log('Trying to refresh token after 401/403 error');
            const refreshed = await refreshAuthToken();

            if (refreshed) {
              // สร้างข้อมูลที่จะส่งไป API (เหมือนกับด้านบน)
              const updateData = {
                ...(params.displayName !== undefined && { displayName: params.displayName }),
                ...(params.email !== undefined && { email: params.email }),
                ...(params.phoneNumber !== undefined && { mobile: params.phoneNumber }),
                ...(params.photoURL !== undefined && { photoURL: params.photoURL })
              };

              // ตรวจสอบว่ามีข้อมูลที่จะอัพเดทหรือไม่
              if (Object.keys(updateData).length === 0) {
                console.warn('No valid data to update after token refresh');
                return { success: false, message: 'No valid data to update' };
              }

              // ถ้ารีเฟรชสำเร็จ ลองเรียก API อีกครั้ง
              console.log('Retrying profile update with new token');
              const retryResponse = await axios({
                method: 'put',
                url: `${API_URL}/users/profile`,
                headers: {
                  'Authorization': `Bearer ${state.token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                data: updateData
              });

              const { user } = retryResponse.data;

              if (user) {
                // อัปเดตข้อมูลผู้ใช้ใน AsyncStorage และ state
                const updatedUser = { ...state.user, ...user };
                await updateUserData(updatedUser);

                setState({
                  ...state,
                  user: updatedUser,
                });

                return { success: true, user: updatedUser };
              }
            }
          } catch (retryError) {
            console.error('Retry error:', retryError);
          }
        }

        // หากทุกอย่างล้มเหลว
        return { success: false, message: 'Authentication failed. Please login again.' };
      }

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Profile update failed'
        };
      }
      return { success: false, message: 'Network error' };
    }

    // ถ้าไม่มีการ return ข้างบน (ไม่ควรเกิดขึ้น แต่เพื่อความปลอดภัย)
    return { success: false, message: 'Unknown error occurred' };
  };
  const refreshUser = async () => {
    try {
      // ดึง token จาก state หรือ AsyncStorage
      const token = state.token || await AsyncStorage.getItem('userToken');
      if (!token) return;

      // เรียก API เพื่อดึงข้อมูล user ล่าสุด
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('refre', response);
      if (response.data && response.data.user) {
        // อัปเดต user ใน state และ AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setState(prev => ({
          ...prev,
          user: response.data.user,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };
  const signOut = async () => {
    try {
      // ถ้ามี token ส่งคำขอล็อกเอาท์ไปยังเซิร์ฟเวอร์

      if (state.token) {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${state.token}`
            }
          });

        } catch (error) {
          //console.error('Error sending logout request:', error);
          // ไม่ต้องทำอะไรต่อ เพราะเราจะล็อกเอาท์ในเครื่องถึงแม้ว่าการส่งคำขอจะล้มเหลว
        }
      }
      await clearRecentlyViewed(); // <-- ใช้ await

      // ลบข้อมูล token, refresh token และ user จาก AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('userToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('tokenExpiry'),
        AsyncStorage.removeItem('user'),
        //AsyncStorage.removeItem('recentlyViewed'),
        AsyncStorage.removeItem('auth_in_progress')
      ]);
      // ลบ Authorization header
      delete axios.defaults.headers.common['Authorization'];

      setState({
        isLoading: false,
        isSignedIn: false,
        token: null,
        refreshToken: null,
        tokenExpiry: null,
        user: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const deleteAccount = async () => {

    setState(prevState => ({ ...prevState, isDeletingAccount: true }));
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(t('common.error'), t('common.loginRequired')); // ใช้ t()
        return;
      }

      // ตรวจสอบว่าเป็น guest user หรือไม่
      const currentUser = state.user;


      // if (currentUser && currentUser.authType === 'guest') {
      //   Alert.alert(t('profile.deleteAccount'), t('profile.guestUserCannotDelete')); // เพิ่มข้อความสำหรับ Guest User
      //   setState(prevState => ({ ...prevState, isDeletingAccount: false }));
      //   return;
      // }


      try {
        await axios.delete(`${API_URL}/users/account`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await clearAuthData(); // ลบข้อมูลการเข้าสู่ระบบทั้งหมด
        await clearRecentlyViewed(); // <-- เพิ่มตรงนี้

        setState({
          isLoading: false,
          isSignedIn: false,
          token: null,
          refreshToken: null,
          tokenExpiry: null,
          user: null,
          isDeletingAccount: false,
        });

        AsyncStorage.removeItem('userToken'),
          AsyncStorage.removeItem('refreshToken'),
          AsyncStorage.removeItem('tokenExpiry'),
          AsyncStorage.removeItem('user'),
          AsyncStorage.removeItem('recentlyViewed'),
          AsyncStorage.removeItem('auth_in_progress')
        Alert.alert(t('common.success'), t('profile.accountDeletedSuccess')); // ใช้ t()
        router.replace('/(auth)/login'); // กลับไปหน้า login
      } catch (error: any) {
        console.error('Delete account error:', error.response?.data || error.message);
        let errorMessage = t('profile.accountDeletedFailed'); // ใช้ t()
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.request) {
          errorMessage = t('auth.networkError'); // ใช้ t()
        }
        Alert.alert(t('common.error'), errorMessage); // ใช้ t()
        setState(prevState => ({ ...prevState, isDeletingAccount: false }));
      }
    } catch (error) {
      console.error('Delete account setup error:', error);
      setState(prevState => ({ ...prevState, isDeletingAccount: false }));
    }
  };
  return (
    <AuthContext.Provider
      value={{
        isLoading: state.isLoading,
        isSignedIn: state.isSignedIn,
        user: state.user,
        signIn,
        refreshUser,
        signUp,
        prepareSignUp,
        verifyOTPAndCompleteSignUp,
        resendOTP, // เพิ่มฟังก์ชันส่ง OTP ใหม่
        signInWithSocial,
        signInAsGuest,
        signOut,
        updateUserProfile,
        deleteAccount, // เพิ่มฟังก์ชันลบบัญชี
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook สำหรับใช้งาน Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}