import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { BASEAPI_CONFIG } from '@/config'; // ตรวจสอบให้แน่ใจว่า import ถูกต้อง

const { width } = Dimensions.get('window');

interface ImageItemProps {
    item: string;
    index: number;
    onPress: (index: number) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ item, index, onPress }) => {
    const [loading, setLoading] = useState(true);

    return (
        <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => onPress(index)}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: `${BASEAPI_CONFIG.UrlImg}${item}` }}
                style={styles.image}
                resizeMode="cover" // เปลี่ยนเป็น cover เพื่อให้ภาพเต็มพื้นที่มากขึ้น
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={(e) => {
                    console.error("Failed to load image:", e.nativeEvent.error);
                    setLoading(false); // หยุดโหลดแม้เกิดข้อผิดพลาด
                }}
            />
            {loading && (
                <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color="#4B74B3" />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        width: width - 70, // ใช้ Dimensions.get('window').width
        height: 230,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 5, // เพิ่มระยะห่างระหว่างรูปภาพ
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLoadingOverlay: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export default ImageItem;