import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
    ScrollView,
    Modal,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { BASEAPI_CONFIG } from '@/config';
import Header from '@/components/Header';
import { fetchUserReviews, deleteReview } from '@/api/reviewService';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ReviewsFeedScreen = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();

    // Modal states
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        loadReviews();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadReviews();
        }, [])
    );

    const loadReviews = async () => {
        try {
            setLoading(true);
            
            // ตรวจสอบว่า user มีค่าหรือไม่
            if (!user || !user.id) {
                console.log('User not found or user.id is undefined');
                setReviews([]);
                setLoading(false);
                return;
            }

            const response = await fetchUserReviews(user.id);
            
            // ตรวจสอบ response structure
            if (response && response.data && Array.isArray(response.data.reviews)) {
                setReviews(response.data.reviews);
            } else {
                console.log('Invalid response structure:', response);
                setReviews([]);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadReviews().then(() => setRefreshing(false));
    }, []);

    const formatDate = (dateString) => {
        try {
            if (!dateString) return t('reviews.justPosted') || 'เพิ่งโพสต์';
            
            const date = new Date(dateString);
            
            // ตรวจสอบว่า date ถูกต้องหรือไม่
            if (isNaN(date.getTime())) {
                return t('reviews.justPosted') || 'เพิ่งโพสต์';
            }
            
            const now = new Date();
            const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

            if (diffInHours < 24) {
                return diffInHours === 0
                    ? t('reviews.justPosted') || 'เพิ่งโพสต์'
                    : t('reviews.hoursAgo', { count: diffInHours }) || `${diffInHours} ชั่วโมงที่แล้ว`;
            } else {
                const diffInDays = Math.floor(diffInHours / 24);
                return t('reviews.daysAgo', { count: diffInDays }) || `${diffInDays} วันที่แล้ว`;
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            return t('reviews.justPosted') || 'เพิ่งโพสต์';
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const safeRating = rating || 0;
        const fullStars = Math.floor(safeRating);
        const hasHalfStar = safeRating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Ionicons key={i} name="star" size={16} color="#FFD700" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
            );
        }

        const emptyStars = 5 - Math.ceil(safeRating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#DDD" />
            );
        }

        return stars;
    };

    const showReviewOptions = (reviewId) => {
        Alert.alert(
            t('reviews.optionsTitle') || 'ตัวเลือก',
            t('reviews.optionsMessage') || 'เลือกการดำเนินการ',
            [
                {
                    text: t('reviews.edit') || 'แก้ไข',
                    onPress: () => handleEditReview(reviewId)
                },
                {
                    text: t('reviews.delete') || 'ลบ',
                    style: 'destructive',
                    onPress: () => handleDeleteReview(reviewId)
                },
                {
                    text: t('common.cancel') || 'ยกเลิก',
                    style: 'cancel'
                }
            ]
        );
    };

    const handleEditReview = (reviewId) => {
        try {
            console.log('Edit review:', reviewId);
            router.push(`/reviews/edit/${reviewId}`);
        } catch (error) {
            console.error('Error navigating to edit review:', error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        Alert.alert(
            t('reviews.deleteTitle') || 'ลบรีวิว',
            t('reviews.deleteMessage') || 'คุณต้องการลบรีวิวนี้หรือไม่?',
            [
                { text: t('common.cancel') || 'ยกเลิก', style: 'cancel' },
                {
                    text: t('reviews.delete') || 'ลบ',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReview(reviewId);
                            setReviews(prev => prev.filter(review => review.review_id !== reviewId));
                            loadReviews();
                            Alert.alert(
                                t('reviews.deleteSuccess') || 'ลบสำเร็จ',
                                t('reviews.deleteSuccessMessage') || 'ลบรีวิวเรียบร้อยแล้ว'
                            );
                        } catch (error) {
                            console.error('Error deleting review:', error);
                            Alert.alert(
                                t('myhome.Error') || 'เกิดข้อผิดพลาด',
                                t('myhome.Errorno') || 'ไม่สามารถลบรีวิวได้'
                            );
                        }
                    }
                }
            ]
        );
    };

    // Image Modal Functions
    const openImageModal = (images, startIndex = 0) => {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return;
        }
        setSelectedImages(images);
        setCurrentImageIndex(startIndex);
        setIsImageModalVisible(true);
    };

    const closeImageModal = () => {
        setIsImageModalVisible(false);
        setSelectedImages([]);
        setCurrentImageIndex(0);
    };

    const goToPreviousImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const goToNextImage = () => {
        if (currentImageIndex < selectedImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const renderImageGallery = (images) => {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return null;
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageGallery}
                contentContainerStyle={styles.imageGalleryContent}
            >
                {images.map((image, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.reviewImageContainer,
                            index === images.length - 1 && styles.lastImage
                        ]}
                        onPress={() => openImageModal(images, index)}
                    >
                        <Image
                            source={{
                                uri: image || 'https://via.placeholder.com/80x80?text=No+Image'
                            }}
                            style={styles.reviewImage}
                            defaultSource={{
                                uri: 'https://via.placeholder.com/80x80?text=No+Image'
                            }}
                            onError={(e) => {
                                console.log('Image load error:', e.nativeEvent.error);
                            }}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderImageModal = () => {
        if (!isImageModalVisible || selectedImages.length === 0) return null;

        return (
            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImageModal}
            >
                <View style={styles.modalContainer}>
                    <StatusBar
                        barStyle="light-content"
                        backgroundColor="rgba(0, 0, 0, 0.9)"
                        translucent={true}
                    />
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeImageModal}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.imageCounter}>
                            {currentImageIndex + 1} / {selectedImages.length}
                        </Text>
                    </View>

                    <View style={styles.imageContainer}>
                        <Image
                            source={{ 
                                uri: selectedImages[currentImageIndex] || 'https://via.placeholder.com/300x300?text=No+Image' 
                            }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                            onError={(e) => {
                                console.log('Modal image load error:', e.nativeEvent.error);
                            }}
                        />
                    </View>

                    {/* Navigation Buttons */}
                    {selectedImages.length > 1 && (
                        <>
                            {currentImageIndex > 0 && (
                                <TouchableOpacity
                                    style={[styles.navButton, styles.prevButton]}
                                    onPress={goToPreviousImage}
                                >
                                    <Ionicons name="chevron-back" size={30} color="#fff" />
                                </TouchableOpacity>
                            )}

                            {currentImageIndex < selectedImages.length - 1 && (
                                <TouchableOpacity
                                    style={[styles.navButton, styles.nextButton]}
                                    onPress={goToNextImage}
                                >
                                    <Ionicons name="chevron-forward" size={30} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {/* Image Dots Indicator */}
                    {selectedImages.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {selectedImages.map((_, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentImageIndex && styles.activeDot
                                    ]}
                                    onPress={() => setCurrentImageIndex(index)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>
        );
    };

    const renderReviewItem = ({ item }) => {
        if (!item) return null;

        return (
            <View style={styles.reviewCard}>
                {/* Header */}
                <View style={styles.reviewHeader}>
                    <View style={styles.userInfo}>
                        <Image
                            source={{
                                uri: user?.photoURL || 'https://via.placeholder.com/40x40?text=U'
                            }}
                            style={styles.userAvatar}
                            onError={(e) => {
                                console.log('Avatar load error:', e.nativeEvent.error);
                            }}
                        />
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {user?.displayName || user?.username || 'Test'}
                            </Text>
                            <Text style={styles.reviewDate}>
                                {formatDate(item.created_at)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => showReviewOptions(item.review_id)}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Restaurant Info */}
                <TouchableOpacity
                    style={styles.restaurantInfo}
                    onPress={() => {
                        try {
                            router.push({
                                pathname: `/places/details`,
                                params: { id: item.store_id }
                            });
                        } catch (error) {
                            console.error('Navigation error:', error);
                        }
                    }}
                >
                    <Text style={styles.restaurantName}>{item.store_name || 'ร้านอาหาร'}</Text>
                    <View style={styles.ratingContainer}>
                        <View style={styles.starsContainer}>
                            {renderStars(item.rating)}
                        </View>
                        <Text style={styles.ratingText}>{item.rating || 0}</Text>
                    </View>
                </TouchableOpacity>

                {/* Images */}
                {item.images && item.images.length > 0 && (
                    renderImageGallery(item.images)
                )}

                {/* Review Text */}
                <Text style={styles.reviewComment}>{item.review_text || ''}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#fff"
                    translucent={false}
                />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButtons}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {t('reviews.review') || 'รีวิวของฉัน'}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.centerContainer}>
                        <Text>{t('reviews.loading') || 'กำลังโหลด...'}</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#fff"
                translucent={false}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButtons}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('reviews.review') || 'รีวิวของฉัน'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {reviews.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={80} color="#E0E0E0" />
                        <Text style={styles.emptyText}>
                            {t('reviews.noReviews') || 'ยังไม่มีรีวิว'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {t('reviews.noReviewsSubtext') || 'เริ่มเขียนรีวิวร้านอาหารที่คุณชอบ'}
                        </Text>
                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={() => {
                                try {
                                    router.push('/(tabs)/home');
                                } catch (error) {
                                    console.error('Navigation error:', error);
                                }
                            }}
                        >
                            <Ionicons name="search" size={20} color="#fff" />
                            <Text style={styles.exploreButtonText}>
                                {t('favorite.SearchRestaurants') || 'ค้นหาร้านค้า'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={reviews}
                        renderItem={renderReviewItem}
                        keyExtractor={(item, index) => item?.review_id?.toString() || index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#4B74B3']}
                            />
                        }
                    />
                )}

                {/* Image Modal */}
                {renderImageModal()}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        marginTop: Platform.OS === 'ios' ? 35 : 25,
    },
    safeArea: {
        flex: 1,
        //backgroundColor: 'transparent',
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
    backButtons: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    reviewCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    menuButton: {
        padding: 4,
    },
    restaurantInfo: {
        marginBottom: 12,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B74B3',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 6,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    imageGallery: {
        marginBottom: 12,
    },
    imageGalleryContent: {
        paddingRight: 16,
    },
    reviewImageContainer: {
        marginRight: 8,
    },
    lastImage: {
        marginRight: 0,
    },
    reviewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    reviewComment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    exploreButton: {
        flexDirection: 'row',
        backgroundColor: '#4B74B3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 35 : 25,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 10,
    },
    imageCounter: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: screenWidth,
        height: screenHeight * 0.7,
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        padding: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
    },
    prevButton: {
        left: 20,
    },
    nextButton: {
        right: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default ReviewsFeedScreen;