// components/ImageGalleryModal.tsx
import React, { useState, useRef, useEffect } from 'react';
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
import { BASEAPI_CONFIG } from '@/config'; // ตรวจสอบให้แน่ใจว่า import ถูกต้อง

const { width, height } = Dimensions.get('window');

interface ImageGalleryModalProps {
    visible: boolean;
    images: string[];
    initialIndex: number;
    onClose: () => void;
    isReviewImage?: boolean; // เพิ่ม prop เพื่อแยกว่าเป็นรูปรีวิวหรือไม่
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
    visible,
    images,
    initialIndex,
    onClose,
    isReviewImage = false,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);
    const FullImageItem: React.FC<{ uri: string }> = ({ uri }) => {
        const [loading, setLoading] = useState(true);

        return (
            <View style={styles.fullImageWrapper}>
                <Image
                    source={{ uri }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={(e) => {
                        console.error("Failed to load full screen image:", e.nativeEvent.error);
                        setLoading(false);
                    }}
                />
                {loading && (
                    <View style={styles.fullScreenImageLoading}>
                        <ActivityIndicator size="large" color="#FFF" />
                    </View>
                )}
            </View>
        );
    };
   const renderFullImage = ({ item }: { item: string }) => {
    const imageUrl = isReviewImage ? item : `${BASEAPI_CONFIG.UrlImg}${item}`;
    return <FullImageItem uri={imageUrl} />;
};
    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / width);
        setCurrentIndex(newIndex);
    };

    const goToPrevImage = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
        }
    };

    const goToNextImage = () => {
        if (currentIndex < images.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    if (!visible || !images || images.length === 0) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            onRequestClose={onClose}
            animationType="fade"
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close-circle" size={36} color="#FFF" />
                </TouchableOpacity>

                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={renderFullImage}
                    keyExtractor={(item, index) => `full-image-${index}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(data, index) => (
                        { length: width, offset: width * index, index }
                    )}
                />

                {images.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <TouchableOpacity style={[styles.navigationButton, styles.prevButton]} onPress={goToPrevImage}>
                                <Ionicons name="chevron-back" size={30} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        {currentIndex < images.length - 1 && (
                            <TouchableOpacity style={[styles.navigationButton, styles.nextButton]} onPress={goToNextImage}>
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
        backgroundColor: 'rgba(0, 0, 0, 0.95)', // เพิ่มความเข้มของพื้นหลัง
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40, // ปรับตำแหน่งให้เหมาะสม
        right: 20,
        zIndex: 10, // ตรวจสอบให้แน่ใจว่าอยู่บนสุด
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // ไม่ต้องมีพื้นหลัง
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
        width: '100%',
        height: '80%', // ปรับความสูงให้เหมาะสม
    },
    fullScreenImageLoading: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // เพิ่มพื้นหลังขณะโหลด
    },
    navigationButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // ปรับความโปร่งใส
        borderRadius: 25, // ทำให้เป็นวงกลม
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 40, // ปรับตำแหน่งให้เหมาะสม
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // ปรับความโปร่งใส
        paddingHorizontal: 15,
        paddingVertical: 8, // เพิ่ม padding
        borderRadius: 20, // ทำให้โค้งมนขึ้น
    },
    imageCounterText: {
        color: '#ffffff',
        fontSize: 16, // เพิ่มขนาดตัวอักษร
        fontWeight: 'bold',
    },
});

export default ImageGalleryModal;