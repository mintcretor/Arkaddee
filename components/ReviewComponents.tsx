import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    FlatList,
    Modal,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import reviewService from '@/api/reviewService';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
// ประเภทข้อมูลสำหรับรีวิว
interface Review {
    id: string | number;
    userName: string;
    userImage: string;
    date: string;
    rating: number;
    text: string;
    images: string[];
    likes: number;
}

interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

interface StoreData {
    id: string | number;
    name?: string;
    reviews?: Review[];
    reviewSummary?: {
        average_rating: number;
        review_count: number;
    };
}

// Star Rating Component
export const StarRating: React.FC<{
    rating: number;
    size?: number;
    editable?: boolean;
    onRatingChange?: ((rating: number) => void) | null;
}> = ({
    rating,
    size = 20,
    editable = false,
    onRatingChange = null
}) => {
        const renderStars = () => {
            const stars = [];
            const maxStars = 5;

            for (let i = 1; i <= maxStars; i++) {
                const starName = i <= rating ? "star" : "star-outline";
                stars.push(
                    <TouchableOpacity
                        key={i}
                        onPress={() => editable && onRatingChange && onRatingChange(i)}
                        disabled={!editable}
                        style={{ padding: 2 }}
                    >
                        <Ionicons name={starName} size={size} color="#FFD700" />
                    </TouchableOpacity>
                );
            }
            return stars;
        };

        return (
            <View style={{ flexDirection: 'row' }}>
                {renderStars()}
            </View>
        );
    };

// Review Item Component
export const ReviewItem: React.FC<{
    review: Review;
    onImagePress?: (images: string[], index: number) => void;
}> = ({ review, onImagePress }) => {
    const { isSignedIn } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(review.likes || 0);
    const { t } = useTranslation();

    // ฟังก์ชันกดไลค์หรือยกเลิกไลค์
    const handleLike = async () => {
        if (!isSignedIn) {
            Alert.alert(t('common.alert'), t('common.login_before_like')); // "แจ้งเตือน", "กรุณาล็อกอินก่อนกดไลค์รีวิว"
            return;
        }

        try {
            const response = await reviewService.toggleLikeReview(review.id);

            if (response.success) {
                setLiked(response.data.action === 'liked');
                setLikesCount(response.data.likesCount);
            } else {
                throw new Error(response.message || t('store.cannot_like_review')); // "ไม่สามารถกดไลค์รีวิวได้"
            }
        } catch (error) {
            console.error('Error liking review:', error);
            Alert.alert(t('common.error'), t('store.cannot_process')); // "ข้อผิดพลาด", "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง"
        }
    };

    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <Image
                    source={{ uri: review.userImage }}
                    style={styles.userImage}
                    resizeMode="cover"
                />
                <View style={styles.reviewUserInfo}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
            </View>

            <View style={styles.ratingContainer}>
                <StarRating rating={review.rating} size={16} />
                <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
            </View>
            {review.images && review.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesContainer}>
                    {review.images.map((image, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onImagePress?.(review.images, index)}
                            activeOpacity={0.8}
                            style={styles.reviewImageWrapper}
                        >
                            <Image
                                source={{ uri: `${image}` }}
                                style={styles.reviewImage}
                                resizeMode="cover"
                            />
                            {/* เพิ่มไอคอนขยายรูป */}
                            <View style={styles.imageExpandIcon}>
                                <Ionicons name="expand-outline" size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <Text style={styles.reviewText}>{review.text}</Text>

            <View style={styles.reviewActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleLike}
                    disabled={!isSignedIn}
                >
                    <Ionicons
                        name={liked ? "thumbs-up" : "thumbs-up-outline"}
                        size={16}
                        color={liked ? "#4B74B3" : "#666"}
                    />
                    <Text style={[
                        styles.actionText,
                        liked && { color: "#4B74B3" }
                    ]}>
                        {t('store.like_this_review')} ({likesCount})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Write Review Modal Component with Image Upload
export const WriteReviewModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSubmit: (reviewData: any) => Promise<void>;
    storeId: string | number;
}> = ({
    visible,
    onClose,
    onSubmit,
    storeId
}) => {
        const { isSignedIn } = useAuth();
        const [rating, setRating] = useState(0);
        const [reviewText, setReviewText] = useState('');
        const [images, setImages] = useState<string[]>([]);
        const [uploading, setUploading] = useState(false);
        const [uploadProgress, setUploadProgress] = useState(0);
        const { t } = useTranslation();
        const resetForm = () => {
            setRating(0);
            setReviewText('');
            setImages([]);
            setUploadProgress(0);
        };

        const handleSubmit = async () => {
            if (!isSignedIn) {
                Alert.alert(t('common.alert'), t('common.login_before_review'));
                return;
            }

            if (rating === 0) {
                Alert.alert(t('common.warning'), t('store.please_rate'));
                return;
            }

            try {
                setUploading(true);

                // Upload images first and get their URLs
                let imageUrls: string[] = [];
                if (images.length > 0) {
                    setUploadProgress(0.1); // เริ่มที่ 10%
                    const result = await reviewService.uploadReviewImages(images);
                    if (result.data) {

                        imageUrls = result.data.map((image: any) => image.url);
                        setUploadProgress(0.5); // 50% หลังอัปโหลดรูป

                    }
                    setUploadProgress(0.7); // 70% หลังอัปโหลดรูปเสร็จ
                }

                // Create review data with uploaded image URLs
                const reviewData = {
                    storeId,
                    rating,
                    text: reviewText,
                    images: imageUrls
                };

                setUploadProgress(0.8); // 80% ก่อนส่งข้อมูลรีวิว

                // Send review data to API
                const response = await reviewService.createReview(reviewData);
                setUploadProgress(1); // 100% เมื่อเสร็จสมบูรณ์
                if (response.success) {
                    // Call the onSubmit callback with the review data


                    await onSubmit(response.data); // <-- เพิ่ม await
                    resetForm();
                    onClose();
                } else {
                    throw new Error(response.message || t('store.cannot_create_review'));
                }
            } catch (error: any) {
                Alert.alert(t('common.error'), error.message || t('store.cannot_post_review'));
                console.error('Error submitting review:', error);
            } finally {
                setUploading(false);
            }
        };

        // Function to pick images from library
        const handlePickImages = async () => {
            // Request permission first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(t('common.warning'), t('store.need_gallery_permission'));
                return;
            }

            try {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                    allowsMultipleSelection: true,
                    selectionLimit: 5 - images.length, // Limit total images to 5
                });

                if (!result.canceled && result.assets) {
                    // Check file size limit (2MB per image)
                    const newImages = [...images];

                    for (const asset of result.assets) {
                        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

                        if (fileInfo.size > 20 * 1024 * 1024) {
                            Alert.alert(t('store.file_too_large'), t('store.image_size_limit'));
                        } else if (newImages.length < 5) {
                            newImages.push(asset.uri);
                        }
                    }

                    setImages(newImages);
                }
            } catch (error) {
                Alert.alert(t('common.error'), t('store.cannot_pick_image'));
                console.error('Image picker error:', error);
            }
        };

        // Function to take a photo with the camera
        const handleTakePhoto = async () => {
            // Request camera permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(t('common.warning'), t('store.need_camera_permission'));
                return;
            }

            try {
                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    // Check if we reached the limit of 5 images
                    if (images.length >= 5) {
                        Alert.alert(t('common.warning'), t('store.max_5_images')); return;
                    }

                    // Check file size
                    const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);

                    if (fileInfo.size > 20 * 1024 * 1024) {
                        Alert.alert(t('store.file_too_large'), t('store.image_size_limit'));
                    } else {
                        setImages([...images, result.assets[0].uri]);
                    }
                }
            } catch (error) {
                Alert.alert(t('common.error'), t('store.cannot_take_photo'));
                console.error('Camera error:', error);
            }
        };

        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent={false}
                onRequestClose={onClose}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('store.write_a_review')}</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[
                                styles.submitButton,
                                { opacity: (rating > 0 && !uploading) ? 1 : 0.5 }
                            ]}
                            disabled={rating === 0 || uploading}
                        >
                            <Text style={styles.submitText}>{t('store.post')}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <View style={styles.ratingSection}>
                            <Text style={styles.ratingLabel}>{t('reviews.rateYourExperience')}</Text>
                            <StarRating
                                rating={rating}
                                size={36}
                                editable={true}
                                onRatingChange={setRating}
                            />
                        </View>

                        <TextInput
                            style={styles.reviewInput}
                            placeholder={t('reviews.shareYourExperience')}
                            placeholderTextColor="#999"
                            multiline={true}
                            numberOfLines={5}
                            value={reviewText}
                            onChangeText={setReviewText}
                        />

                        <View style={styles.imagePickerSection}>
                            <Text style={styles.imagePickerLabel}>
                                {t('store.add_images', { count: images.length })}
                            </Text>

                            <View style={styles.imagePickerButtons}>
                                <TouchableOpacity
                                    style={styles.imagePickerButton}
                                    onPress={handlePickImages}
                                    disabled={images.length >= 5 || uploading}
                                >
                                    <Ionicons name="images-outline" size={22} color="#4B74B3" />
                                    <Text style={styles.imagePickerButtonText}>{t('store.gallery')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.imagePickerButton}
                                    onPress={handleTakePhoto}
                                    disabled={images.length >= 5 || uploading}
                                >
                                    <Ionicons name="camera-outline" size={22} color="#4B74B3" />
                                    <Text style={styles.imagePickerButtonText}>{t('store.camera')}</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.imagePreviewContainer}
                            >
                                {images.map((image, index) => (
                                    <View key={index} style={styles.imagePreview}>
                                        <Image source={{ uri: image }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => {
                                                const newImages = [...images];
                                                newImages.splice(index, 1);
                                                setImages(newImages);
                                            }}
                                            disabled={uploading}
                                        >
                                            <Ionicons name="close-circle" size={22} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>

                            {images.length > 0 && (
                                <Text style={styles.imageHelpText}>{t('store.image_size_hint')}</Text>

                            )}
                        </View>
                    </ScrollView>

                    {uploading && (
                        <View style={styles.uploadingOverlay}>
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator size="large" color="#4B74B3" />
                                <Text style={styles.uploadingText}>{t('store.uploading_images')}</Text>
                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            { width: `${uploadProgress * 100}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {Math.round(uploadProgress * 100)}%
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        );
    };

// Review List Section Component
export const ReviewsSection: React.FC<{
    restaurantId: StoreData | string | number;
    lastUpdate?: number;
    onImagePress?: (images: string[], index: number) => void;
    onReviewAdded?: () => void;
}> = ({ restaurantId, lastUpdate, onImagePress, onReviewAdded }) => {

    const { isSignedIn, user } = useAuth();
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const [stats, setStats] = useState<ReviewStats>({
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // ตรวจสอบว่า restaurantId เป็น object หรือเป็น string/number
    const storeId = typeof restaurantId === 'object' && restaurantId !== null
        ? restaurantId.id
        : restaurantId;

    // Fetch reviews from API
    const fetchReviews = async (pageNum = 1, refresh = false) => {
        if (!storeId) return;
        try {
            setLoading(true);

            const response = await reviewService.fetchStoreReviews(storeId, pageNum, 10);

            if (response.success) {
                if (refresh) {
                    setReviews(response.data.reviews);
                } else {
                    setReviews(prev => [...prev, ...response.data.reviews]);
                }

                setStats(response.data.stats);
                setPage(pageNum);
                setHasMore(
                    response.data.pagination.page * response.data.pagination.limit <
                    response.data.pagination.total
                );
            } else {
                // ถ้าไม่มีข้อมูลจาก API ให้ใช้ข้อมูลจาก props
                if (typeof restaurantId === 'object' && restaurantId.reviews) {
                    setReviews(restaurantId.reviews);
                    // คำนวณ stats เองจากข้อมูลที่มี
                    calculateStats(restaurantId.reviews);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // หากมีข้อผิดพลาดในการเรียก API ให้ใช้ข้อมูลจาก props แทน
            if (typeof restaurantId === 'object' && restaurantId.reviews) {
                setReviews(restaurantId.reviews);
                calculateStats(restaurantId.reviews);
            }
        } finally {
            setLoading(false);
        }
    };

    // คำนวณสถิติรีวิวเมื่อไม่สามารถเรียก API ได้
    const calculateStats = (reviewList: Review[]) => {
        if (!reviewList || reviewList.length === 0) {
            return;
        }

        // หาคะแนนเฉลี่ย
        const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviewList.length;

        // นับจำนวนแต่ละดาว
        const ratingBreakdown = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };

        reviewList.forEach(review => {
            const rating = Math.floor(review.rating);
            if (rating >= 1 && rating <= 5) {
                ratingBreakdown[rating]++;
            }
        });

        setStats({
            totalReviews: reviewList.length,
            averageRating,
            ratingBreakdown
        });
    };

    // Load reviews when component mounts
    useEffect(() => {
        if (storeId) {
            fetchReviews(1, true);
        }
    }, [storeId, lastUpdate]);

    const handleSubmitReview = async (reviewData: any) => {
        await fetchReviews(1, true);
        if (onReviewAdded) {
            onReviewAdded();
        }
    };

    const loadMoreReviews = () => {
        if (hasMore && !loading) {
            fetchReviews(page + 1, false);
        }
    };

    return (
        <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('store.customer_review')}</Text>
                <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => {
                        if (!user || user.authType === 'guest') {
                            Alert.alert(
                                t('common.guestTitle'),
                                t('common.guestReviewOrFav'),
                                [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    { text: t('common.signup'), onPress: () => router.push('/(auth)/register') }
                                ]
                            );
                            return;
                        }
                        setShowWriteReview(true);
                    }}
                >
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.writeReviewText}>{t('store.write_a_review')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.reviewsSummary}>
                <View style={styles.ratingOverview}>
                    <Text style={styles.overallRating}>{stats.averageRating.toFixed(1)}</Text>
                    <StarRating rating={stats.averageRating} size={18} />
                    <Text style={styles.totalReviews}>{t('store.from_reviews', { count: stats.totalReviews })}</Text>
                </View>
                <View style={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.ratingBreakdown[star] || 0;
                        const percentage = stats.totalReviews > 0
                            ? (count / stats.totalReviews) * 100
                            : 0;

                        return (
                            <View key={star} style={styles.ratingBar}>
                                <Text style={styles.starLabel}>{t('store.star', { count: star })}</Text>
                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            { width: `${percentage}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={[{marginLeft:10}]}>({count})</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {loading && reviews.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B74B3" />
                    <Text style={styles.loadingText}>{t('store.loading_reviews')}</Text>
                </View>
            ) : (
                <>
                    {reviews.length === 0 ? (
                        <View style={styles.noReviewsContainer}>
                            <Ionicons name="chatbox-ellipses-outline" size={50} color="#ccc" />
                            <Text style={styles.noReviewsText}>{t('store.no_reviews')}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={reviews}
                            renderItem={({ item }) => (
                                <ReviewItem
                                    review={item}
                                    onImagePress={onImagePress}
                                />
                            )}
                            keyExtractor={item => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false} // Let the parent ScrollView handle scrolling
                            ListFooterComponent={
                                <>
                                    {loading && reviews.length > 0 && (
                                        <View style={styles.loadingMoreContainer}>
                                            <ActivityIndicator size="small" color="#4B74B3" />
                                            <Text style={styles.loadingMoreText}>{t('store.loading_more_review')}</Text>
                                        </View>
                                    )}

                                    {hasMore && !loading && (
                                        <TouchableOpacity
                                            style={styles.viewAllButton}
                                            onPress={loadMoreReviews}
                                        >
                                            <Text style={styles.viewAllText}>{t('store.load_more_review')}</Text>
                                            <Ionicons name="chevron-down" size={16} color="#4B74B3" />
                                        </TouchableOpacity>
                                    )}
                                </>
                            }
                        />
                    )}
                </>
            )}

            <WriteReviewModal
                visible={showWriteReview}
                onClose={() => setShowWriteReview(false)}
                onSubmit={handleSubmitReview}
                storeId={storeId}
            />
        </View>
    );
};

// Additional styles for new components
const styles = StyleSheet.create({
    // Review Section Styles
    reviewsSection: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    writeReviewButton: {
        flexDirection: 'row',
        backgroundColor: '#4B74B3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    writeReviewText: {
        color: '#FFF',
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },

    // Review Summary Styles
    reviewsSummary: {
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    ratingOverview: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        paddingRight: 15,
        width: '30%',
    },
    overallRating: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    totalReviews: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    ratingBreakdown: {
        flex: 1,
        paddingLeft: 15,
        justifyContent: 'center',
    },
    ratingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    starLabel: {
        width: 45,
        fontSize: 12,
        color: '#666',
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFD700',
    },

    // Review Item Styles
    reviewItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
        marginBottom: 15,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewUserInfo: {
        marginLeft: 10,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    reviewImagesContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    reviewImageWrapper: {
        position: 'relative',
        marginRight: 8,
    },
    reviewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    imageExpandIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 2,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
        marginBottom: 10,
    },
    reviewActions: {
        flexDirection: 'row',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 5,
        fontSize: 12,
        color: '#666',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        marginTop: 10,
    },
    viewAllText: {
        fontSize: 14,
        color: '#4B74B3',
        marginRight: 5,
    },

    // Write Review Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#4B74B3',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
    },
    submitText: {
        color: '#FFF',
        fontWeight: '500',
    },
    ratingSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ratingLabel: {
        fontSize: 16,
        marginBottom: 15,
        color: '#333',
    },
    reviewInput: {
        margin: 16,
        padding: 12,
        height: 150,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        textAlignVertical: 'top',
        fontSize: 16,
        color:'#000'
    },
    imagePickerSection: {
        padding: 16,
    },
    imagePickerLabel: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    imagePreviewContainer: {
        flexDirection: 'row',
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    addImageText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
    },

    // New styles for image picker
    imagePickerButtons: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F6FF',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 10,
    },
    imagePickerButtonText: {
        color: '#4B74B3',
        fontSize: 14,
        marginLeft: 5,
    },
    imageHelpText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },

    // Uploading overlay
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    uploadingText: {
        fontSize: 16,
        color: '#333',
        marginTop: 10,
        marginBottom: 15,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },

    // Loading and no reviews styles
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    loadingMoreContainer: {
        padding: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loadingMoreText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    noReviewsContainer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
    },
    noReviewsText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

// ส่งออกคอมโพเนนต์เพื่อนำไปใช้งาน
export default {
    StarRating,
    ReviewItem,
    WriteReviewModal,
    ReviewsSection
};