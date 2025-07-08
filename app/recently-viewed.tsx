import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { router } from 'expo-router';
import { BASEAPI_CONFIG } from '@/config';
import Header from '@/components/Header';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
import { useTranslation } from 'react-i18next';

const RecentlyViewedScreen = () => {
    const {
        recentlyViewed,
        isLoading,
        removeFromRecentlyViewed,
        clearRecentlyViewed
    } = useRecentlyViewed();
    const { t } = useTranslation();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'เพิ่งดู';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} ${t('common.minutes_ago')}`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} ${t('common.hours_ago')}`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} ${t('common.days_ago')}`;
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            t('common.clear_history'),
            t('common.clear_history_confirmation'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.clear'),
                    style: 'destructive',
                    onPress: clearRecentlyViewed
                },
            ]
        );
    };

    const handleRemoveItem = (item) => {
        Alert.alert(
            t('common.remove_from_history'),
            t('common.remove_from_history_confirmation', { name: item.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.remove'),
                    onPress: () => removeFromRecentlyViewed(item.id)
                },
            ]
        );
    };

    const renderStarRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Ionicons key={i} name="star" size={12} color="#FFD700" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Ionicons key="half" name="star-half" size={12} color="#FFD700" />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#FFD700" />
            );
        }

        return stars;
    };
    const onPlacePress = (ids: number | string) => {
        router.push({
            pathname: `/places/details`,
            params: { id: ids }
        });
    };
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => onPlacePress(`/${item.id}`)}
        >
            <Image
                source={{
                    uri: item.image ? `${BASEAPI_CONFIG.UrlImg}${item.image}` : null
                }}
                style={styles.itemImage}
                defaultSource={{ uri: 'https://via.placeholder.com/60x60?text=No+Image' }}
            />

            <View style={styles.itemContent}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>

                {/* Rating */}
                {item.rating > 0 && (
                    <View style={styles.ratingContainer}>
                        <View style={styles.starsContainer}>
                            {renderStarRating(item.rating)}
                        </View>
                        <Text style={styles.ratingText}>
                            {parseFloat(item.rating).toFixed(1)}
                        </Text>
                    </View>
                )}

                {/* Cuisines */}
                <Text style={styles.itemCuisines} numberOfLines={1}>
                    {item.cuisines?.join(' • ') || t('common.no_cuisines')}
                </Text>


                {/* View Time */}
                <Text style={styles.viewedTime}>{formatDate(item.viewedAt)}</Text>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveItem(item)}
            >
                <Ionicons name="close-circle" size={24} color="#ccc" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
                <SafeAreaView style={styles.safeArea}>
                    <Header />
                    <View style={styles.centerContainer}>
                        <Text>{t('common.loading')}</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <SafeAreaView style={styles.safeArea}>
                {/* Back Button */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                        <Text style={styles.backText}>
                            {t('common.back')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('common.recently_viewed')}</Text>
                        {recentlyViewed.length > 0 && (
                            <TouchableOpacity onPress={handleClearAll}>
                                <Text style={styles.clearButton}>
                                    {t('common.clear_all')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {recentlyViewed.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {t('common.no_recently_viewed')}
                            </Text>
                            <Text style={styles.emptySubtext}>

                                {t('common.no_recently_viewed_subtext')}
                            </Text>
                            <TouchableOpacity
                                style={styles.exploreButton}
                                onPress={() => router.push('/(tabs)/home')}
                            >
                                <Text style={styles.exploreButtonText}>
                                    {t('common.explore_places')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={recentlyViewed}
                            renderItem={renderItem}
                            keyExtractor={(item) => `${item.id}-${item.viewedAt}`}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: StatusBar.currentHeight || 30,
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#000',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButton: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
        backgroundColor: '#fff',
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    itemContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 6,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    itemCuisines: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        color: '#4B74B3',
        fontWeight: '500',
        marginBottom: 4,
    },
    viewedTime: {
        fontSize: 12,
        color: '#999',
    },
    deleteButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    exploreButton: {
        backgroundColor: '#4B74B3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default RecentlyViewedScreen;