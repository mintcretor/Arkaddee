import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import reviewService from '@/api/reviewService';
import { useTranslation } from 'react-i18next';

const EditReviewScreen = () => {
    const { reviewId } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(0);
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const loadReview = async () => {
            setLoading(true);
            try {
                const response = await reviewService.fetchReviewById(reviewId);
                const review = response.data;
                setReviewText(review.text);
                setRating(review.rating || 0);
                setImages(review.images || []);
            } catch (e) {
                Alert.alert(t('common.error'), t('common.errorLoadingData'));
                router.back();
            }
            setLoading(false);
        };
        loadReview();
    }, [reviewId]);

    // เลือกรูปจากเครื่อง
    const handlePickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.warning'), // "คำเตือน"
                t('common.galleryPermissionMessage') // "ต้องการสิทธิ์การเข้าถึงคลังรูปภาพเพื่อเลือกรูปภาพ"
            );
            return;
        }
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 5 - images.length,
            });
            if (!result.canceled && result.assets) {
                const newImages = [...images];
                for (const asset of result.assets) {
                    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                    if (fileInfo.size > 20 * 1024 * 1024) {
                        Alert.alert(
                            t('common.fileTooLarge'),
                            t('common.fileSizeLimit')
                        );
                    } else if (newImages.length < 5) {
                        newImages.push(asset.uri);
                    }
                }
                setImages(newImages);
            }
        } catch (error) {
            Alert.alert(
                t('common.error'), // "เกิดข้อผิดพลาด"
                t('common.imageSelectionFailed') // "ไม่สามารถเลือกรูปภาพได้"
            );
        }
    };

    // ถ่ายรูป
    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('common.warning'), // "คำเตือน"
                t('common.cameraPermissionMessage') // "ต้องการสิทธิ์การเข้าถึงกล้องเพื่อถ่ายรูป"
            ); return;
        }
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                if (images.length >= 5) {
                    Alert.alert(
                        t('common.warning'), // "คำเตือน"
                        t('reviews.maxImages') // "คุณสามารถอัปโหลดได้สูงสุด 5 รูป"
                    ); return;
                }
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size > 20 * 1024 * 1024) {
                    Alert.alert(
                        t('common.fileTooLarge'),
                        t('common.fileSizeLimit')
                    );
                } else {
                    setImages([...images, result.assets[0].uri]);
                }
            }
        } catch (error) {
            Alert.alert(
                t('common.error'),
                t('common.photoCaptureFailed')
            );
        }
    };

    // ลบรูป
    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // อัปเดตรีวิว
    const handleSave = async () => {
        //if (!reviewText.trim()) {
        //    Alert.alert(
        //        t('common.warning'), // "แจ้งเตือน"
        //        t('reviews.pleaseEnterReview') // "กรุณากรอกรีวิว"
        //    ); return;
        //}
        if (rating < 1 || rating > 5) {
            Alert.alert(
                t('common.warning'),
                t('reviews.pleaseRate15') // "กรุณาให้คะแนน 1-5"
            ); return;
        }
        setUploading(true);
        try {
            let imageUrls: string[] = [];
            if (images.length > 0) {
                setUploadProgress(0.1);
                const result = await reviewService.uploadReviewImages(images);
                console.log('123456', result);
                if (result.data) {
                    imageUrls = result.data.map((image: any) => image.url);
                    setUploadProgress(0.7);
                }
            }
            setUploadProgress(0.8);
            await reviewService.updateReview(reviewId, {
                text: reviewText,
                rating,
                images: imageUrls.length > 0 ? imageUrls : images, // ถ้าไม่ได้อัปโหลดใหม่ ให้ใช้ url เดิม
            });
            setUploadProgress(1);
            Alert.alert(
                t('common.success'), // "สำเร็จ"
                t('reviews.reviewSaved'), // "บันทึกรีวิวเรียบร้อยแล้ว"
                [{ text: t('common.ok'), onPress: () => router.back() }]
            );
        } catch (e) {
            Alert.alert(
                t('common.error'),
                t('reviews.saveFailed') // "ไม่สามารถบันทึกรีวิวได้"
            );
        }
        setUploading(false);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4B74B3" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#FFF' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{t('reviews.editReviewTitle')}</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={[
                            styles.submitButton,
                            { opacity: (rating > 0 && !uploading) ? 1 : 0.5 }
                        ]}
                        disabled={rating === 0 || uploading}
                    >
                        <View>
                            <Text style={styles.submitText}>
                                {uploading ? t('reviews.saving') : t('common.save')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView>
                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>{t('reviews.rateYourExperience')}</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.starButton,
                                        rating >= num && styles.starButtonActive,
                                    ]}
                                    onPress={() => setRating(num)}
                                >
                                    <Text style={[
                                        styles.star,
                                        rating >= num && styles.starActive
                                    ]}>★</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.imagePickerSection}>
                        <Text style={styles.imagePickerLabel}>
                            {t('reviews.addPhotoLabel', { count: images.length })}
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
                                <Text style={styles.imagePickerButtonText}>{t('store.take_photo')}</Text>
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
                                        onPress={() => handleRemoveImage(index)}
                                        disabled={uploading}
                                    >
                                        <Ionicons name="close-circle" size={22} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                        {images.length > 0 && (
                            <Text style={styles.imageHelpText}>
                                {t('common.fileSizeLimit')}
                            </Text>
                        )}
                    </View>

                    <TextInput
                        style={styles.reviewInput}
                        placeholder={t('reviews.shareYourExperience')}
                        placeholderTextColor="#999"
                        multiline={true}
                        numberOfLines={5}
                        value={reviewText}
                        onChangeText={setReviewText}
                        textAlignVertical="top"
                    />

                </ScrollView>

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <View style={styles.uploadingContainer}>
                            <ActivityIndicator size="large" color="#4B74B3" />
                            <Text style={styles.uploadingText}>{t('reviews.uploadingImages')}</Text>
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        { width: `${(uploadProgress || 0) * 100}%` }
                                    ]}
                                />
                            </View>
                            <View>
                                <Text style={styles.progressText}>
                                    {Math.round((uploadProgress || 0) * 100)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 50 : 50,
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
    ratingRow: { flexDirection: 'row', marginBottom: 10 },
    starButton: {
        padding: 8,
        marginHorizontal: 2,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
    },
    starButtonActive: {
        backgroundColor: '#FFD700',
    },
    star: {
        fontSize: 28,
        color: '#bbb',
    },
    starActive: {
        color: '#fff',
        textShadowColor: '#f5c518',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    imagePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    imagePreviewBox: {
        position: 'relative',
        marginRight: 10,
        marginBottom: 10,
    },
    imagePreview: {
        width: 64,
        height: 64,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    addImageBox: {
        width: 64,
        height: 64,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4B74B3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#fff',
        color:'#000'
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
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
export default EditReviewScreen;