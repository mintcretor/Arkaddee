import '../i18n';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Router, Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback, useRef } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LocationProvider } from '@/utils/LocationContext';
import { BackHandler, Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import AqiCacheService from '@/utils/AqiCacheService';
import { RecentlyViewedProvider } from '@/hooks/useRecentlyViewed';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device'
// ป้องกัน SplashScreen จากการซ่อนโดยอัตโนมัติ
SplashScreen.preventAutoHideAsync();

// ✅ Helper function ตรวจสอบ iPad
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 600;
};

// ✅ Helper function สำหรับ safe navigation
const safeNavigate = async (
  router: Router,
  action: (() => void) | undefined,
  fallbackAction: (() => void) | undefined = undefined
) => {
  try {
    if (typeof action === 'function') {
      action();
    }
    return true;
  } catch (error) {
    console.error('Navigation error:', error);
    if (fallbackAction && typeof fallbackAction === 'function') {
      try {
        fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
      }
    }
    return false;
  }
};

// สร้าง Layout ภายในเพื่อใช้งาน AuthContext
function MainLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [showModal, setShowModal] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { t } = useTranslation();
  // ✅ ใช้ useRef เพื่อ track timers และป้องกัน memory leaks
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMounted = useRef(true);

  // ✅ Cleanup function สำหรับ timers
  const clearAllTimers = useCallback(() => {
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current = [];
  }, []);

  // ✅ Safe setTimeout ที่จะไม่ทำงานหาก component unmounted
  const safeSetTimeout = useCallback((callback: () => void, delay: number | undefined) => {
    const timer = setTimeout(() => {
      if (isMounted.current) {
        callback();
      }
    }, delay);
    timers.current.push(timer);
    return timer;
  }, []);

  const { isSignedIn, isLoading: authLoading } = useAuth();

  // ✅ Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // ✅ รอให้ Auth พร้อมก่อน - ปรับปรุงให้ปลอดภัยขึ้น
  useEffect(() => {
    if (!authLoading && isMounted.current) {
      safeSetTimeout(() => {
        if (isMounted.current) {
          setIsAuthReady(true);
        }
      }, 200);
    }
  }, [authLoading, safeSetTimeout]);

  // ✅ ล้างประวัติการนำทางเมื่อมีการ Logout - เพิ่ม safety check
  useEffect(() => {
    if (!isSignedIn && navigationHistory.length > 0 && isMounted.current) {
      console.log('User logged out, clearing navigation history');
      setNavigationHistory([]);
    }
  }, [isSignedIn, navigationHistory.length]);

  // ✅ ตรวจสอบว่าอยู่ในหน้าหลัก (home) หรือไม่
  const isMainScreen = useCallback(() => {
    if (!pathname) return false;
    return (
      pathname === '/(tabs)/home' ||
      pathname === '/home' ||
      pathname === '/' ||
      pathname === '/(tabs)' ||
      pathname === '/(tabs)/'
    );
  }, [pathname]);

  // ✅ ตรวจสอบว่าอยู่ในหน้า auth หรือไม่
  const isAuthScreen = useCallback(() => {
    if (!pathname) return false;
    return pathname.includes('/(auth)');
  }, [pathname]);

  // ✅ ตรวจสอบว่าอยู่ในหน้า login หรือไม่
  const isLoginScreen = useCallback(() => {
    if (!pathname) return false;
    return pathname.includes('/(auth)/login');
  }, [pathname]);

  // ✅ เก็บประวัติการนำทาง - ปรับปรุงให้ปลอดภัยขึ้น
  useEffect(() => {
    if (
      isAuthReady &&
      pathname &&
      isSignedIn &&
      !isMainScreen() &&
      !isAuthScreen() &&
      isMounted.current
    ) {
      setNavigationHistory(prev => {
        if (!prev.includes(pathname)) {
          const newHistory = [...prev, pathname].slice(-10);
          console.log('Navigation history updated:', newHistory);
          return newHistory;
        }
        return prev;
      });
    }
  }, [pathname, isSignedIn, isAuthReady, isMainScreen, isAuthScreen]);

  const [loaded] = useFonts({}); // ✅ แก้ให้ loaded = true ทันที


  // ✅ ดึงข้อมูล AQI ล่วงหน้า - เพิ่ม error handling
  useEffect(() => {
    const prepareData = async () => {
      if (!isMounted.current) return;

      try {
        console.log('กำลังเตรียมข้อมูลแอป...');
        await AqiCacheService.prefetchAqiData();

        if (isMounted.current) {
          setIsDataReady(true);
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเตรียมข้อมูล:', error);
        if (isMounted.current) {
          setIsDataReady(true); // ยังคงให้แอปทำงานต่อได้
        }
      }
    };

    prepareData();
  }, []);

  // ✅ ซ่อน Splash Screen เมื่อทุกอย่างพร้อม - เพิ่ม error handling
  useEffect(() => {
    const hideSplash = async () => {
      if (loaded && isDataReady && isAuthReady && isMounted.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));

          if (isMounted.current) {
            await SplashScreen.hideAsync();
            setIsInitialLoading(false);
          }
        } catch (e) {
          console.warn('ไม่สามารถซ่อน Splash Screen:', e);
          if (isMounted.current) {
            setIsInitialLoading(false);
          }
        }
      }
    };

    hideSplash();
  }, [loaded, isDataReady, isAuthReady, safeSetTimeout]);

  // Custom Dialog Component
  const CustomBackDialog = () => (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View>
            <Text style={styles.modalTitle}>{t('common.alert')}</Text>
          </View>
          <View>
            <Text style={styles.modalMessage}>{t('common.exit_app_confirm')}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <View>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => {
                setShowModal(false);
                safeSetTimeout(() => {
                  BackHandler.exitApp();
                }, 100);
              }}
            >
              <View>
                <Text style={styles.exitButtonText}>{t('common.exit_app')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✅ จัดการกับการกดปุ่มย้อนกลับ - ปรับปรุงให้ปลอดภัยขึ้น
  const handleBackPress = useCallback(() => {
    console.log(isMounted.current);
    try {
      if (!isAuthReady || !isMounted.current) {
        console.log('Auth not ready or component unmounted, ignoring back press');
        return true;
      }

      console.log('Back button pressed. Current path:', pathname);
      console.log('Platform:', Platform.OS, 'IsTablet:', isTablet());

      // ขั้นที่ 1: ถ้าโมดัลกำลังแสดง ให้ปิดโมดัลก่อน
      if (showModal) {
        setShowModal(false);
        return true;
      }

      // ขั้นที่ 2: ถ้าอยู่ในหน้าหลักอยู่แล้ว หรือเป็นหน้าล็อกอิน
      // ให้แสดงกล่องยืนยันการออกแอป ไม่ใช่กลับหน้า home
      if (isMainScreen() || isLoginScreen() || pathname === '/(auth)' || pathname === '/(auth)/') {
        setShowModal(true);
        return true;
      }

      // ขั้นที่ 3: ถ้าออกจากระบบแล้ว และอยู่ในหน้า Auth อื่นๆ (ไม่ใช่ login)
      // ให้ไปหน้า login แทนการกลับหน้า home
      if (!isSignedIn && isAuthScreen() && !isLoginScreen()) {
        safeNavigate(router, () => router.replace('/(auth)/login/login'));
        return true;
      }

      // ขั้นที่ 4: ถ้าสามารถย้อนกลับได้ และไม่ได้อยู่ในกรณีข้างต้น ให้กลับไปที่หน้า home เสมอ
      const canGoBack = router?.canGoBack?.();
      if (canGoBack) {
        safeNavigate(
          router,
          () => {
            // Always navigate to home when going back from a non-main, non-auth screen
            console.log('Navigating back to home screen.');
            router.replace('/(tabs)/home');
          },
          () => {
            // Fallback if replace fails
            console.error('Fallback navigation to home failed.');
            //router.replace('/(tabs)/home');
          }
        );
        return true;
      }

      // ขั้นที่ 5: ถ้าไม่มีที่ให้กลับแล้ว (เช่น เริ่มต้นแอปที่หน้า Home โดยตรง)
      // ให้แสดงกล่องยืนยันการออก
      setShowModal(true);
      return true;
    } catch (error) {
      console.error('Error in handleBackPress:', error);
      // แสดงโมดัลแทน crash
      setShowModal(true);
      return true;
    }
  }, [
    pathname,
    showModal,
    isSignedIn,
    isAuthReady,
    router,
    isMainScreen,
    isAuthScreen,
    isLoginScreen,
    safeNavigate // Make sure safeNavigate is in the dependency array
  ]);


  // ✅ BackHandler setup - ปรับปรุงให้ปลอดภัยขึ้น
  useEffect(() => {
    if (!isMounted.current) return;

    const timer = safeSetTimeout(() => {
      if (isMounted.current) {
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          handleBackPress
        );

        return () => backHandler?.remove?.();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [handleBackPress, safeSetTimeout]);

  // ✅ แสดง loading screen - ปรับปรุงข้อความ
  if (!loaded || !isDataReady || !isAuthReady || isInitialLoading || authLoading) {
    const loadingMessage = authLoading
      ? t('common.checking_login') // "Checking login status..."
      : isTablet() && Platform.OS === 'ios'
        ? t('common.optimizing_for_ipad') // "Optimizing for iPad..."
        : t('common.loading');

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  return (
    <RecentlyViewedProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DefaultTheme : DefaultTheme}>
        <CustomBackDialog />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' && isTablet() ? 'fade' : 'slide_from_right', // ใช้ fade บน iPad
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
              gestureEnabled: false
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false
            }}
          />
          <Stack.Screen
            name="+not-found"
            options={{
              headerShown: false
            }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'light'} />
      </ThemeProvider>
    </RecentlyViewedProvider>
  );
}

// ✅ RootLayout ที่ปรับปรุงแล้ว - เพิ่ม ErrorBoundary
export default function RootLayout() {
  const [isProviderReady, setIsProviderReady] = useState(false);
  const isMounted = useRef(true);
  const { t } = useTranslation();
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ รอให้ providers พร้อมก่อน
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsProviderReady(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // ✅ แสดง loading screen ระหว่างรอ providers
  if (!isProviderReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('common.starting_app')}</Text>
      </View>
    );
  }

  return (

    <RecentlyViewedProvider>
      <AuthProvider>
        <LocationProvider>
          <MainLayout />
        </LocationProvider>
      </AuthProvider>
    </RecentlyViewedProvider>

  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000'
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: '#000'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  exitButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ff4444',
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  exitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});