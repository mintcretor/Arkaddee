
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getUserFavorites, removeFavorite } from '@/api/baseapi';
import { BASEAPI_CONFIG } from '@/config';
import { StarRating } from '@/components/ReviewComponents';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const FavoritesScreen = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });
  const [removingIds, setRemovingIds] = useState(new Set());
  const { t,i18n } = useTranslation();

  // ดึงข้อมูล favorites
  const fetchFavorites = async (page = 1, isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getUserFavorites(page, pagination.limit);

      if (response.success === true) {
        const newFavorites = response.favorites || [];

        if (page === 1 || isRefresh) {
          setFavorites(newFavorites);
        } else {
          setFavorites(prev => [...prev, ...newFavorites]);
        }

        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      if (error.message.includes(t('favorite.loginRequired'))) {
        Alert.alert(t('favorite.loginRequired'), t('favorite.loginRequired'));
        router.replace('/(auth)/login');
      } else {
        Alert.alert(t('common.error'), t('favorite.fetchError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // ลบร้านออกจาก favorites
  const handleRemoveFavorite = async (storeId, storeName) => {
    console.log('Removing favorite:', storeId, storeName);
    Alert.alert(
      t('favorite.removeFavorite'),
      `${t('favorite.confirmRemove')} "${storeName}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingIds(prev => new Set([...prev, storeId]));

              await removeFavorite(storeId);

              // อัพเดต state โดยลบร้านออก
              setFavorites(prev => prev.filter(item => item.id !== storeId));

              // อัพเดต pagination
              setPagination(prev => ({
                ...prev,
                total: Math.max(0, prev.total - 1)
              }));

              Alert.alert(t('favorite.success'), t('store.removedFromFavorites'));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert(t('common.error'), t('favorite.removeError'));
            } finally {
              setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(storeId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  // โหลดข้อมูลเมื่อหน้าแสดง
  useFocusEffect(
    useCallback(() => {
      fetchFavorites(1, true);
    }, [user])
  );

  // รีเฟรชข้อมูล
  const onRefresh = () => {
    fetchFavorites(1, true);
  };

  // โหลดข้อมูลเพิ่ม
  const loadMore = () => {
    if (!loadingMore && pagination.page < pagination.total_pages) {
      fetchFavorites(pagination.page + 1);
    }
  };

  // ไปหน้ารายละเอียดร้าน
  const goToStoreDetail = (storeId) => {
    router.push({
      pathname: `/places/details`,
      params: { id: storeId }
    });
  };

  // Component แสดงแต่ละร้าน
  const FavoriteItem = ({ item }) => {
    console.log('Rendering item:', item.id, item.name);
    const isRemoving = removingIds.has(item.store_id);

    return (
      <TouchableOpacity
        style={[styles.favoriteItem, isRemoving && styles.removingItem]}
        onPress={() => goToStoreDetail(item.store_id)}
        disabled={isRemoving}
        activeOpacity={0.7}
      >
        {/* รูปภาพร้าน */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.images && item.images.length > 0
                ? `${BASEAPI_CONFIG.UrlImg}${item.images[0]}`
                : 'https://via.placeholder.com/150x100?text=No+Image'
            }}
            style={styles.storeImage}
            resizeMode="cover"
          />

          {/* ปุ่มลบ favorites */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item.id, item.name)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#FF5252" />
            ) : (
              <AntDesign name="heart" size={16} color="#FF5252" />
            )}
          </TouchableOpacity>
        </View>

        {/* ข้อมูลร้าน */}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* รีวิวและคะแนน */}
          {item.average_rating && (
            <View style={styles.ratingContainer}>
              <StarRating rating={parseFloat(item.average_rating)} size={14} />
              <Text style={styles.ratingText}>
                {parseFloat(item.average_rating).toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({item.review_count || 0} {t('profile.review')})
              </Text>
            </View>
          )}

          {/* ประเภทร้าน */}
          {item.types && item.types.length > 0 && (
            <View style={styles.typesContainer}>
              {item.types.slice(0, 2).map((type, index) => (
                <View key={index} style={styles.typeTag}>
                  <Text style={styles.typeText}>{type}</Text>
                </View>
              ))}
              {item.types.length > 2 && (
                <Text style={styles.moreTypes}>+{item.types.length - 2}</Text>
              )}
            </View>
          )}

          {/* วันที่เพิ่มเข้า favorites */}
          <Text style={styles.favoriteDate}>
            {t('favorite.addedAt', {
              date: new Date(item.updated_at).toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US')
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading Screen
  if (loading && favorites.length === 0) {
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
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('favorite.Favorite')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5252" />
          <Text style={styles.loadingText}>{t('favorite.loadingmore')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ไม่ได้ล็อกอิน
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('favorite.Favorite')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <AntDesign name="heart" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>{t('favorite.loginRequired')}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorite.Favorite')}</Text>
        <Text style={styles.countText}>({pagination.total})</Text>
      </View>

      {/* Favorites List */}
      <FlatList
        data={favorites}
        renderItem={({ item }) => <FavoriteItem item={item} />}
        keyExtractor={(item) => item.favorite_id?.toString() || item.id?.toString()}
        contentContainerStyle={favorites.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5252']}
            tintColor="#FF5252"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#FF5252" />
              <Text style={styles.loadingMoreText}>{t('favorite.loadingmore')}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AntDesign name="heart" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>{t('favorite.Nofavorite')}</Text>
            <Text style={styles.emptyText}>
              {t('favorite.NoFavoriteText')}
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreButtonText}>
                {t('favorite.SearchRestaurants')}</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

   marginTop: Platform.OS === 'ios' ? 40 : 0, // ปรับถ้าจำเป็น
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  favoriteItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  removingItem: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  storeInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  typesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  typeTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  moreTypes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  favoriteDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FavoritesScreen;