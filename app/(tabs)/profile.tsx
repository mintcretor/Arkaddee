import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  InteractionManager,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { uploadProfileImage, getUserFavorites } from '@/api/baseapi';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useFocusEffect } from 'expo-router';

import {
  Feather,
  FontAwesome,
  MaterialIcons,
  Ionicons,
  AntDesign,
  SimpleLineIcons
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import LanguageSelector from '@/components/LanguageSelector';

// Type definitions
interface User {
  displayName?: string;
  username?: string;
  photoURL?: string;
  id?: string;
}

interface FavoritesResponse {
  status: string;
  success?: boolean | string;
  data?: {
    favorites: any[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface UploadResponse {
  status: string;
  message?: string;
  data: {
    url: string;
  };
}
const HEADER_HEIGHT = 50;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const TOP_SPACING = Platform.OS === 'ios' ? 0 : 0;
const ProfileScreen: React.FC = () => {
  // ใช้ destructuring ที่ปลอดภัยขึ้น
  const authContext = useAuth();
  const { 
    signOut, 
    user, 
    updateUserProfile, 
    deleteAccount, 
    refreshUser 
  } = authContext || {};

  const [uploading, setUploading] = useState<boolean>(false);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // ใช้ useMemo สำหรับ computed values
  const profileImage = useMemo(() => {
    return user?.photoURL || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxrfvii_BfKyaxXwS7zy8WFZwnru9ZLL0MEg&s';
  }, [user?.photoURL]);

  const isGuest = useMemo(() => {
    return user?.authType === 'guest';
  }, [user?.authType]);

  const { t } = useTranslation();
  
  // ใช้ optional chaining และ default values
  const recentlyViewedContext = useRecentlyViewed();
  const { 
    recentlyViewed = [], 
    clearRecentlyViewed 
  } = recentlyViewedContext || {};

  // ใช้ useCallback เพื่อหลีกเลี่ยง re-render ที่ไม่จำเป็น
  const fetchFavoritesCount = useCallback(async (): Promise<void> => {
    if (!user || !user.id || isGuest) {
      setFavoritesCount(0);
      return;
    }


    try {
      setLoadingFavorites(true);
      
      // ตรวจสอบว่า API function มีอยู่จริง
      if (typeof getUserFavorites !== 'function') {
        console.warn('getUserFavorites function is not available');
        return;
      }

      const response: FavoritesResponse = await getUserFavorites(1, 1);
      if (response && (response.success === true || response.success === 'success' || response.status === 'success')) {
        const total = response.pagination?.total || response.data?.favorites?.length || 0;
        setFavoritesCount(total);
      } else {
        setFavoritesCount(0);
      }
    } catch (error) {

      console.warn('Error fetching favorites count:', error);
      setFavoritesCount(0);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user, isGuest]);

  // ใช้ InteractionManager เพื่อให้ UI render ก่อน
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsInitialized(true);
      if (user && !isGuest) {
        // Delay การเรียก API เล็กน้อยเพื่อให้ UI render เสร็จก่อน
          fetchFavoritesCount();
      }
    });

    return () => interaction.cancel();
  }, [user, isGuest, fetchFavoritesCount]);

  // ใช้ useFocusEffect อย่างระมัดระวัง
  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) return;
        if (user && !isGuest) {
            fetchFavoritesCount();
        }
    }, [isInitialized, refreshUser, user, isGuest, fetchFavoritesCount])
  );

  // ใช้ useCallback สำหรับ event handlers
  const goToFavorites = useCallback((): void => {
    if (!user || isGuest) {
      Alert.alert(
        t('auth.login'),
        t('common.loginRequiredFavorites'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    router.push('/favorites');
  }, [user, isGuest, t]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('common.galleryPermissionMessage')
        );
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Error requesting permission:', error);
      return false;
    }
  }, [t]);

  const handlePickImage = useCallback(async (): Promise<void> => {
    if (uploading) return;
    
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
      Alert.alert(t('common.error'), t('common.imageSelectionFailed'));
    }
  }, [uploading, requestPermission, t]);

  const handleTakePhoto = useCallback(async (): Promise<void> => {
    if (uploading) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('common.cameraPermissionMessage')
        );
        return;
      }

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
      Alert.alert(t('common.error'), t('common.photoCaptureFailed'));
    }
  }, [uploading, t]);

  const handleUploadImage = useCallback(async (uri: string): Promise<void> => {
    if (uploading) return;
    
    setUploading(true);
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = (fileInfo.size || 0) / (1024 * 1024);

      if (fileSize > 20) {
        Alert.alert(t('common.fileTooLarge'), t('common.fileSizeLimit'));
        return;
      }

      if (!user) {
        Alert.alert(t('common.error'), t('common.loginRequiredUpload'));
        return;
      }

      const response: UploadResponse = await uploadProfileImage(uri);

      if (response.status === 'success') {
        if (updateUserProfile && typeof updateUserProfile === 'function') {
          const updateResult = await updateUserProfile({
            photoURL: response.data.url
          });

          if (!updateResult?.success) {
            console.warn('Failed to update profile in user context:', updateResult?.message);
          }
        }

        Alert.alert(t('common.success'), t('common.profilePicUpdated'));
      } else {
        throw new Error(response.message || t('common.uploadFailed'));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('common.uploadFailedTryAgain')
      );
    } finally {
      setUploading(false);
    }
  }, [uploading, user, updateUserProfile, t]);

  const showPhotoOptions = useCallback((): void => {
    if (uploading || isGuest) return;

    Alert.alert(
      t('profile.ChangePhoto'),
      t('common.choosePhotoMethod'),
      [
        {
          text: t('store.take_photo'),
          onPress: handleTakePhoto,
        },
        {
          text: t('store.gallery'),
          onPress: handlePickImage,
        },
        {
          text: t('common.cancel'),
          style: "cancel"
        }
      ]
    );
  }, [uploading, isGuest, t, handleTakePhoto, handlePickImage]);

  const handleLogout = useCallback((): void => {
    Alert.alert(
      t('auth.logout'),
      t('common.confirmLogout'),
      [
        {
          text: t('common.cancel'),
          style: "cancel"
        },
        {
          text: t('auth.logout'),
          onPress: async () => {
            try {
              setUploading(true);
              
              if (signOut && typeof signOut === 'function') {
                await signOut();
              }
              
              if (clearRecentlyViewed && typeof clearRecentlyViewed === 'function') {
                await clearRecentlyViewed();
              }

              console.log("Logged out successfully");
              router.push('/(auth)/login');
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert(t('auth.logoutFailed'), t('common.tryAgain'));
            } finally {
              setUploading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [t, signOut, clearRecentlyViewed]);

  const handleDeleteAccount = useCallback((): void => {
    if (!deleteAccount || typeof deleteAccount !== 'function') {
      Alert.alert(t('common.error'), t('profile.deleteAccountNotAvailable'));
      return;
    }

    Alert.alert(
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountMessage'),
      [
        {
          text: t('common.cancel'),
          style: "cancel"
        },
        {
          text: t('profile.deleteAccountConfirm'),
          onPress: async () => {
            try {
              setUploading(true);
              await deleteAccount();
              Alert.alert(t('common.success'), t('profile.accountDeletedSuccess'));
              router.replace('/(auth)/login');
            } catch (error) {
              console.error("Delete account failed:", error);
              Alert.alert(t('common.error'), t('profile.accountDeletedFailed'));
            } finally {
              setUploading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [deleteAccount, t]);

  // แสดง loading screen ในระหว่างที่ initialize
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4A7BF7" />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />



      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={10}
      >
        {/* Profile Info Section */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileImageContainer}>
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
              </View>
            ) : (
              <TouchableOpacity 
                onPress={showPhotoOptions} 
                activeOpacity={0.8}
                disabled={isGuest}
                style={styles.profileImageTouchable}
              >
                <View style={styles.profileImageWrapper}>
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="cover"
                    onError={(error) => console.warn('Image loading error:', error)}
                  />
                </View>
                {!isGuest && (
                  <View style={styles.cameraIconContainer}>
                    <Feather name="camera" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName} numberOfLines={2} ellipsizeMode="tail">
              {user?.displayName || user?.username || t("profile.guestUser")}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={goToFavorites}
              disabled={isGuest}
              activeOpacity={isGuest ? 1 : 0.7}
            >
              <View style={styles.statIconValue}>
                <AntDesign name="heart" size={16} color="#FF5252" />
                <View style={styles.statValueContainer}>
                  {loadingFavorites ? (
                    <ActivityIndicator size="small" color="#4A7BF7" />
                  ) : (
                    <Text style={styles.statValue}>{favoritesCount}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t('profile.favarite')}
              </Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/recently-viewed')}
            >
              <View style={styles.statIconValue}>
                <AntDesign name="eye" size={16} color="#4A7BF7" />
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{(recentlyViewed || []).length}</Text>
                </View>
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t('profile.open_recent')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/user/EditProfileScreen')}
            disabled={isGuest}
            activeOpacity={isGuest ? 1 : 0.7}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="user" size={20} color="#4A7BF7" />
            </View>
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>
              {t('profile.profile')}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/address/add')}
            disabled={isGuest}
            activeOpacity={isGuest ? 1 : 0.7}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="map-pin" size={20} color="#4A7BF7" />
            </View>
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>
              {t('profile.address')}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={goToFavorites}
            disabled={isGuest}
            activeOpacity={isGuest ? 1 : 0.7}
          >
            <View style={styles.menuIconContainer}>
              <AntDesign name="heart" size={20} color="#FF5252" />
            </View>
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>
              {t('profile.favarite')}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/review')}
            disabled={isGuest}
            activeOpacity={isGuest ? 1 : 0.7}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="message-square" size={20} color="#4A7BF7" />
            </View>
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>
              {t('profile.review')}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.menuItemLa}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="globe-outline" size={20} color="#4A7BF7" />
            </View>
            <Text style={styles.menuText}>{t('profile.language')}</Text>
            <View style={styles.languageSelectorWrapper}>
              <LanguageSelector />
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Feather name="log-out" size={20} color="#FF3B30" />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>
              {t('auth.logout')}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Delete Account Section */}
        {!isGuest && (
          <View style={styles.deleteAccountSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <View style={styles.menuIconContainer}>
                <Feather name="trash-2" size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.deleteAccountText]}>
                {t('profile.deleteAccount')}
              </Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: STATUSBAR_HEIGHT || 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A7BF7',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(200, 200, 200, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoContainer: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 200,
  },
  profileNameContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    width: '100%',
    minHeight: 60,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statIconValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    minHeight: 20,
  },
  statValueContainer: {
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A7BF7',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
  },
  menuItemLa: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  languageSelectorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  spacer: {
    height: 80,
    backgroundColor: '#f5f5f5',
  },
  logoutSection: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  deleteAccountSection: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
});


export default ProfileScreen;