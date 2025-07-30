// components/ImageGalleryModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    FlatList,
    TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASEAPI_CONFIG } from '@/config';

const { width, height } = Dimensions.get('window');

interface ImageGalleryModalProps {
    visible: boolean;
    images: string[];
    initialIndex: number;
    onClose: () => void;
    isReviewImage?: boolean;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
    visible,
    images,
    initialIndex,
    onClose,
    isReviewImage = false,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isScrolling, setIsScrolling] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && flatListRef.current && images.length > 0) {
            // ใช้ setTimeout เพื่อให้ modal render เสร็จก่อน
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ 
                    index: Math.max(0, Math.min(initialIndex, images.length - 1)), 
                    animated: false 
                });
                setCurrentIndex(initialIndex);
            }, 100);
        }
    }, [visible, initialIndex, images.length]);

    // Component สำหรับแสดงรูปภาพแต่ละรูป
    const FullImageItem: React.FC<{ uri: string; index: number }> = React.memo(({ uri, index }) => {
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(false);

        return (
            <View style={styles.fullImageWrapper}>
                {!error ? (
                    <Image
                        source={{ uri }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        onError={(e) => {
                            console.error(`Failed to load image ${index}:`, e.nativeEvent.error);
                            setLoading(false);
                            setError(true);
                        }}
                    />
                ) : (
                    <View style={styles.errorContainer}>
                        <Ionicons name="image-outline" size={60} color="#666" />
                        <Text style={styles.errorText}>ไม่สามารถโหลดรูปภาพได้</Text>
                    </View>
                )}
                {loading && !error && (
                    <View style={styles.fullScreenImageLoading}>
                        <ActivityIndicator size="large" color="#FFF" />
                    </View>
                )}
            </View>
        );
    });

    // ปรับปรุง renderItem ให้มีประสิทธิภาพดีขึ้น
    const renderFullImage = useCallback(({ item, index }: { item: string; index: number }) => {
        const imageUrl = isReviewImage ? item : `${BASEAPI_CONFIG.UrlImg}${item}`;
        return <FullImageItem uri={imageUrl} index={index} />;
    }, [isReviewImage]);

    // ปรับปรุงการจัดการ scroll
    const handleScrollBegin = () => {
        setIsScrolling(true);
    };

    const handleScrollEnd = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / width);
        
        // ตรวจสอบว่า index อยู่ในช่วงที่ถูกต้อง
        if (newIndex >= 0 && newIndex < images.length && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
        }
        setIsScrolling(false);
    };

    const goToPrevImage = useCallback(() => {
        if (currentIndex > 0 && !isScrolling) {
            const newIndex = currentIndex - 1;
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
            setCurrentIndex(newIndex);
        }
    }, [currentIndex, isScrolling]);

    const goToNextImage = useCallback(() => {
        if (currentIndex < images.length - 1 && !isScrolling) {
            const newIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
            setCurrentIndex(newIndex);
        }
    }, [currentIndex, images.length, isScrolling]);

    // ปรับปรุง keyExtractor
    const keyExtractor = useCallback((item: string, index: number) => `image-${index}-${item}`, []);

    // ปรับปรุง getItemLayout
    const getItemLayout = useCallback((data: any, index: number) => ({
        length: width,
        offset: width * index,
        index,
    }), []);

    if (!visible || !images || images.length === 0) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            onRequestClose={onClose}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close-circle" size={36} color="#FFF" />
                </TouchableOpacity>

                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={renderFullImage}
                    keyExtractor={keyExtractor}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScrollBeginDrag={handleScrollBegin}
                    onMomentumScrollEnd={handleScrollEnd}
                    initialScrollIndex={Math.max(0, Math.min(initialIndex, images.length - 1))}
                    getItemLayout={getItemLayout}
                    windowSize={3} // จำกัดการ render เฉพาะรูปที่ใกล้เคียง
                    maxToRenderPerBatch={1}
                    initialNumToRender={1}
                    removeClippedSubviews={false} // ปิดเพื่อป้องกันการกระตุก
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                />

                {images.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <TouchableOpacity 
                                style={[styles.navigationButton, styles.prevButton]} 
                                onPress={goToPrevImage}
                                disabled={isScrolling}
                            >
                                <Ionicons name="chevron-back" size={30} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        {currentIndex < images.length - 1 && (
                            <TouchableOpacity 
                                style={[styles.navigationButton, styles.nextButton]} 
                                onPress={goToNextImage}
                                disabled={isScrolling}
                            >
                                <Ionicons name="chevron-forward" size={30} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                        {currentIndex + 1} / {images.length}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        borderRadius: 20,
        padding: 5,
    },
    fullImageWrapper: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '95%', // ลดขนาดเล็กน้อยเพื่อป้องกันการตัด
        height: '80%',
        backgroundColor: 'transparent', // เพิ่มเพื่อป้องกันการกระพริบ
    },
    fullScreenImageLoading: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    errorText: {
        color: '#666',
        marginTop: 10,
        fontSize: 16,
    },
    navigationButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        transform: [{ translateY: -25 }], // จัดกึ่งกลางแนวตั้ง
    },
    prevButton: {
        left: 15,
    },
    nextButton: {
        right: 15,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    imageCounterText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ImageGalleryModal;