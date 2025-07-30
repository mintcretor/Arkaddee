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
                resizeMode="center"
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
        marginHorizontal: 5, // เพิ่มระยะห่างระหว่างรูปภาพ
        backgroundColor: '#000', // พื้นหลังสำหรับกรณีที่รูปภาพไม่โหลด
   
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // ป้องกันการกระพริบ
    },
    imageLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 240, 240, 0.8)', // พื้นหลังโปร่งใสขณะโหลด
        borderRadius: 12, // ต้องตรงกับ imageContainer
    },
});

export default ImageItem;