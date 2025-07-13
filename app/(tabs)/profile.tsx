import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  data: {
    favorites: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

interface UploadResponse {
  status: string;
  message?: string;
  data: {
    url: string;
  };
}

const ProfileScreen: React.FC = () => {
  // Ensure that deleteAccount is destructured from useAuth
  const { signOut, user, updateUserProfile, deleteAccount, refreshUser } = useAuth(); // Added deleteAccount
  const [uploading, setUploading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string>(
    user?.photoURL || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxrfvii_BfKyaxXwS7zy8WFZwnru9ZLL0MEg&s'
  );
  const isGuest = user?.authType === 'guest';

  // เพิ่ม state สำหรับ favorites
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);

  const { t } = useTranslation();
  const { recentlyViewed = [], clearRecentlyViewed } = useRecentlyViewed() as { recentlyViewed?: any[]; clearRecentlyViewed: () => Promise<void> };

  // เรียกใช้ useFocusEffect เพื่อดึงข้อมูล favorites เมื่อหน้าจอถูกเปิด

  // ฟังก์ชันดึงข้อมูล favorites
  const fetchFavoritesCount = async (): Promise<void> => {
    if (!user) {
      setFavoritesCount(0);
      return;
    }

    try {
      setLoadingFavorites(true);
      const response: FavoritesResponse = await getUserFavorites(1, 1); // ดึงแค่หน้าแรก 1 รายการเพื่อดู total

      if (response.success == true || response.success === 'success') { // Corrected access to success
        //console.log('Favorites response:', response);
        setFavoritesCount(response.pagination.total || 0); // Corrected access to total
      }
    } catch (error) {
      // console.error('Error fetching favorites count:', error);
      // ไม่แสดง error เพราะไม่ใช่ฟีเจอร์หลัก
      setFavoritesCount(0);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // เรียกใช้เมื่อ component mount หรือ user เปลี่ยน
  useEffect(() => {
    fetchFavoritesCount();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      // ถ้ามีฟังก์ชัน refreshUser ใน useAuth ให้เรียก
      if (refreshUser) refreshUser();
      // หรือจะ fetch user ใหม่จาก API ตรงนี้ก็ได้
    }, [])
  );

  useEffect(() => {
    if (user?.photoURL) {
      setProfileImage(user.photoURL);
    }
  }, [user?.photoURL]);
  useFocusEffect(
    React.useCallback(() => {
      fetchFavoritesCount();
    }, [])
  );

  // ฟังก์ชันไปหน้า favorites
  const goToFavorites = (): void => {
    if (!user) {
      Alert.alert(
        t('auth.login'), // Translate "กรุณาเข้าสู่ระบบ"
        t('common.loginRequiredFavorites'), // Translate "กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด"
        [
          { text: t('common.cancel'), style: 'cancel' }, // Translate "ยกเลิก"
          { text: t('auth.login'), onPress: () => router.push('/(auth)/login') } // Translate "เข้าสู่ระบบ"
        ]
      );
      return;
    }

    // ไปหน้า favorites (สร้างหน้านี้ถ้ายังไม่มี)
    router.push('/favorites');
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'), // Translate "ต้องการการอนุญาต"
        t('common.galleryPermissionMessage') // Translate "แอปต้องการการอนุญาตเพื่อเข้าถึงคลังรูปภาพของคุณ"
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async (): Promise<void> => {
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
      Alert.alert(t('common.error'), t('common.imageSelectionFailed')); // Translate "เกิดข้อผิดพลาด", "ไม่สามารถเลือกรูปภาพได้"
    }
  };

  const handleTakePhoto = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'), // Translate "ต้องการการอนุญาต"
        t('common.cameraPermissionMessage') // Translate "แอปต้องการการอนุญาตเพื่อเข้าถึงกล้องของคุณ"
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
      Alert.alert(t('common.error'), t('common.photoCaptureFailed')); // Translate "เกิดข้อผิดพลาด", "ไม่สามารถถ่ายรูปได้"
    }
  };

  const handleUploadImage = async (uri: string): Promise<void> => {
    setUploading(true);
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = (fileInfo.size || 0) / (1024 * 1024);

      if (fileSize > 20) {
        Alert.alert(t('common.fileTooLarge'), t('common.fileSizeLimit')); // Translate "ไฟล์มีขนาดใหญ่เกินไป", "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 20MB"
        setUploading(false);
        return;
      }

      if (!user) {
        Alert.alert(t('common.error'), t('common.loginRequiredUpload')); // Translate "ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนอัพโหลดรูปโปรไฟล์"
        setUploading(false);
        return;
      }

      const response: UploadResponse = await uploadProfileImage(uri);

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

        Alert.alert(t('common.success'), t('common.profilePicUpdated')); // Translate "สำเร็จ", "อัพเดทรูปโปรไฟล์เรียบร้อยแล้ว"
      } else {
        throw new Error(response.message || t('common.uploadFailed')); // Translate "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ"
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('common.uploadFailedTryAgain') // Translate "ไม่สามารถอัพโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setUploading(false);
    }
  };

  const showPhotoOptions = (): void => {
    Alert.alert(
      t('profile.ChangePhoto'), // Translate "เปลี่ยนรูปโปรไฟล์"
      t('common.choosePhotoMethod'), // Translate "เลือกวิธีการเปลี่ยนรูปโปรไฟล์"
      [
        {
          text: t('store.take_photo'), // Translate "ถ่ายรูป"
          onPress: handleTakePhoto,
        },
        {
          text: t('store.gallery'), // Translate "เลือกจากคลังรูปภาพ"
          onPress: handlePickImage,
        },
        {
          text: t('common.cancel'), // Translate "ยกเลิก"
          style: "cancel"
        }
      ]
    );
  };

  const handleLogout = (): void => {
    Alert.alert(
      t('auth.logout'), // Translate "ออกจากระบบ"
      t('common.confirmLogout'), // Translate "คุณต้องการออกจากระบบใช่หรือไม่?"
      [
        {
          text: t('common.cancel'), // Translate "ยกเลิก"
          style: "cancel"
        },
        {
          text: t('auth.logout'), // Translate "ออกจากระบบ"
          onPress: async () => {
            try {
              setUploading(true);
              await signOut();
              await clearRecentlyViewed(); // <-- ใช้ await

              console.log("Logged out successfully");
              router.push('/(auth)/login');
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert(t('auth.logoutFailed'), t('common.tryAgain')); // Translate "ออกจากระบบไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง"
            } finally {
              setUploading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // New function for deleting account
  const handleDeleteAccount = (): void => {
    Alert.alert(
      t('profile.deleteAccountTitle'), // "Delete Account"
      t('profile.deleteAccountMessage'), // "Are you sure you want to delete your account? This action cannot be undone."
      [
        {
          text: t('common.cancel'), // "Cancel"
          style: "cancel"
        },
        {
          text: t('profile.deleteAccountConfirm'), // "Delete"
          onPress: async () => {
            if (!deleteAccount) {
              Alert.alert(t('common.error'), t('profile.deleteAccountNotAvailable')); // "Delete account function not available."
              return;
            }
            try {
              setUploading(true); // Reusing uploading state for general async operations
              const result = await deleteAccount(); // Call the deleteAccount function from useAuth
              // console.log('789289789',result);
              // if (result.success) {
              Alert.alert(t('common.success'), t('profile.accountDeletedSuccess')); // "Account deleted successfully."
              router.replace('/(auth)/login'); // Redirect to login or signup after deletion
              // } else {
              //  Alert.alert(t('common.error'), result.message || t('profile.accountDeletedFailed')); // "Failed to delete account."
              //}
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
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView style={styles.scrollContainer}>
        {/* Header Background with Mountains */}


        {/* Profile Image */}


        {/* Profile Info Section */}
        <View style={styles.profileInfoContainer}>

          <View style={styles.profileImageContainer}>
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
              </View>
            ) : (
              <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.8}>
                <View style={styles.profileImageWrapper}>
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                </View>
                <View style={styles.cameraIconContainer}>
                  <Feather name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.profileName}>
            {user?.displayName || user?.username || t("profile.guestUser")} {/* Translate "Guest User" */}
          </Text>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {/* Favorites Section - แก้ไขจากเดิม */}
            <TouchableOpacity
              style={styles.statItem}
              onPress={goToFavorites}
              disabled={isGuest}
              activeOpacity={isGuest ? 1 : 0.7}
            >
              <View style={styles.statIconValue}>
                <AntDesign name="heart" size={16} color="#FF5252" />
                {loadingFavorites ? (
                  <ActivityIndicator
                    size="small"
                    color="#4A7BF7"
                    style={{ marginLeft: 4 }}
                  />
                ) : (
                  <Text style={styles.statValue}>{favoritesCount}</Text>
                )}
              </View>
              <Text style={styles.statLabel}>{t('profile.favarite')}</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* Recently Viewed Section */}
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/recently-viewed')}
            >
              <View style={styles.statIconValue}>
                <AntDesign name="eye" size={16} color="#4A7BF7" />
                <Text style={styles.statValue}>{recentlyViewed.length}</Text>
              </View>
              <Text style={styles.statLabel}>{t('profile.open_recent')}</Text>
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
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>{t('profile.profile')}</Text>
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
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>{t('profile.address')}</Text>
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
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>{t('profile.favarite')}</Text>
          
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
            <Text style={[styles.menuText, isGuest && { color: '#ccc' }]}>{t('profile.review')}</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemLa}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="globe-outline" size={20} color="#4A7BF7" />
            </View>
            <Text style={styles.menuText}>{t('profile.language')}</Text>
            <LanguageSelector />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Feather name="log-out" size={20} color="#FF3B30" />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>{t('auth.logout')}</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Delete Account Section (New) */}
        <View style={styles.deleteAccountSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuIconContainer}>
              <Feather name="trash-2" size={20} color="#FF3B30" />
            </View>
            <Text style={[styles.menuText, styles.deleteAccountText]}>{t('profile.deleteAccount')}</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  statusTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
  },
  statusText: {
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  headerBackground: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileImageContainer: {

    marginTop: 50,
    marginBottom: 30,
    alignSelf: 'center',
    zIndex: 1000,
  },
  profileImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
    color: '#4A7BF7',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLa: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuTextL: {
    flexDirection: 'row',
    fontSize: 16,
    color: '#333',
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-end', // เพิ่มบรรทัดนี้
    display: 'flex',        // เพิ่มบรรทัดนี้
    paddingRight: 20,       // เพิ่มบรรทัดนี้
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  // เพิ่ม styles สำหรับ favorites badge
  favoritesBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  favoritesBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  spacer: {
    height: 110,
    backgroundColor: '#f5f5f5',
  },
  logoutSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8, // Added margin to separate from new section
  },
  // New style for delete account section
  deleteAccountSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    bottom: 6,
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  languageSelector: {
    position: 'absolute',
    bottom: 150,
    right: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  languageFlag: {
    fontSize: 12,
    marginRight: 4,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  bottomNavContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 2.5,
  },

});

export default ProfileScreen;