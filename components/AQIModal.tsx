import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
    Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AQIModal = ({ visible, marker, onClose }) => {
    if (!marker) return null;

    const getAQIRange = (value) => {
        if (value <= 15) return '0.0 - 15.0';
        if (value <= 30) return '15.1 - 25.0';
        if (value <= 37.5) return '25.1 - 37.5';
        if (value <= 75) return '37.6 - 75.0';
        return '75.1 ขึ้นไป';
    };

    const getAQItext = (value) => {
        if (value <= 15) return 'อากาศดีมาก';
        if (value <= 30) return 'อากาศดี';
        if (value <= 40) return 'เริ่มมีผลกระทบ ต่อสุขภาพ';
        if (value <= 75) return 'มีผลกระทบ ต่อสุขภาพ';
        return 'มีผลกระทบ ต่อสุขภาพ';
    };

    const getAQILabel = (value) => {
        if (value <= 15) return 'คุณภาพดีมาก';
        if (value <= 30) return 'คุณภาพดี';
        if (value <= 40) return 'ปานกลาง';
        if (value <= 75) return 'เริ่มมีผลกระทบต่อสุขภาพ';
        return 'มีผลกระทบต่อสุขภาพ';
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return `เวลา ${date.getHours().toString().padStart(2, '0')}.00 น.`;
    };

    const getBackgroundColor = (value) => {
        if (value <= 15) return '#00BFF3';
        if (value <= 30) return '#00A651';
        if (value <= 40) return '#FDC04E';
        if (value <= 75) return '#F26522';
        return '#CD0000';
    };

    const getBackgroundImage = (value) => {
        if (value <= 15) 
            return require('@/assets/images/pm25/bg1.png');
        if (value <= 30) 
            return require('@/assets/images/pm25/bg2.png');
        if (value <= 37.5) 
            return require('@/assets/images/pm25/bg3.png');
        if (value <= 75) 
            return require('@/assets/images/pm25/bg4.png');
        return require('@/assets/images/pm25/bg5.png');
    };

    const getMascot = (value) => {
        if (value <= 15) return require('@/assets/images/DUST_GIRL-11-02.png');
        if (value <= 30) return require('@/assets/images/DUST_GIRL-11-03.png');
        if (value <= 37.5) return require('@/assets/images/DUST_GIRL-11-04.png');
        if (value <= 75) return require('@/assets/images/DUST_GIRL-11-05.png');
        return require('@/assets/images/DUST_GIRL-11-06.png');
    };

    const getRecommendations = (value) => {
        // คุณภาพดีมาก (0-15)
        if (value <= 15) {
            return [
                'คุณภาพอากาศดีมาก สามารถทำกิจกรรมกลางแจ้งได้ตามปกติ',
                'เป็นช่วงเวลาที่เหมาะสำหรับเปิดหน้าต่างเพื่อระบายอากาศภายในบ้าน'
            ];
        } 
        // คุณภาพดี (15.1-25)
        else if (value <= 30) {
            return [
                'คุณภาพอากาศยังดี สามารถทำกิจกรรมกลางแจ้งได้ตามปกติ',
                'ผู้ที่มีโรคประจำตัวเกี่ยวกับระบบทางเดินหายใจควรเฝ้าระวังอาการผิดปกติ'
            ];
        } 
        // เริ่มมีผลกระทบต่อสุขภาพ (25.1-37.5)
        else if (value <= 37.5) {
            return [
                'ควรลดระยะเวลาการทำกิจกรรมกลางแจ้งที่ใช้แรงมาก',
                'ผู้ที่มีโรคเกี่ยวกับระบบทางเดินหายใจควรพกยาประจำตัว',
                'ปิดหน้าต่างเพื่อลดฝุ่นเข้าบ้าน และอาจใช้เครื่องฟอกอากาศ'
            ];
        } 
        // มีผลกระทบต่อสุขภาพ (37.6-75)
        else if (value <= 75) {
            return [
                'ควรสวมหน้ากาก N95 เมื่อต้องอยู่กลางแจ้ง',
                'งดการออกกำลังกายกลางแจ้งทุกชนิด',
                'ประชาชนทั่วไปและผู้มีโรคประจำตัวควรอยู่ในอาคาร',
                'ใช้ครื่องเติมอากาศควบคู่กับเครื่องฟอกอากาศภายในบ้านเพื่อลดฝุ่น PM2.5'
            ];
        } 
        // มีผลกระทบต่อสุขภาพมาก (75.1 ขึ้นไป)
        else {
            return [
                'หลีกเลี่ยงการออกนอกอาคารโดยไม่จำเป็น',
                'สวมหน้ากาก N95 ตลอดเวลาเมื่ออยู่นอกอาคาร',
                'ปิดประตูหน้าต่างให้สนิท ใช้เครื่องเติมอากาศควบคู่กับเครื่องฟอกอากาศ',
                'ประชาชนทั่วไปและผู้มีโรคประจำตัวควรอยู่ในอาคาร',
                'หากมีอาการผิดปกติให้พบแพทย์ทันที'
            ];
        }
    };

    const recommendationItems = getRecommendations(marker.aqi).map((item, index) => (
        <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationText}>{item}</Text>
        </View>
    ));

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Image
                    source={getBackgroundImage(marker.aqi)}
                    style={styles.backgroundImage}
                />
                
                {/* Header with close button and location */}
                <View style={[styles.cardHeader, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                    <View style={styles.locationWrapper}>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {marker.dustboy_name || t('common.Not_specified')}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.circleSection}>
                    <View style={styles.circleContainerPm}>
                        {/* วงแหวนด้านนอก */}
                        <View style={[styles.circleRing, { borderColor: getBackgroundColor(marker.aqi) }]} />
                        {/* วงกลมด้านใน (เนื้อหา) */}
                        <View style={styles.circleInner}>
                            <Text style={[styles.aqiValue, { color: getBackgroundColor(marker.aqi) }]}>{marker.aqi}</Text>
                            <Text style={[styles.aqiUnit, { color: getBackgroundColor(marker.aqi) }]}>ug/m³</Text>
                            <Text style={[styles.timeText, { color: getBackgroundColor(marker.aqi) }]}>{formatTime(marker.log_datetime)}</Text>
                        </View>
                    </View>
                </View>

                {/* มาสคอตและกล่องคำพูด */}
                <View style={styles.mascotContainer}>
                    {/* กล่องคำพูด (Speech Bubble) */}
                    <View style={[styles.speechBubble, { backgroundColor: getBackgroundColor(marker.aqi) }]}>
                        {/* หัวบอลลูน */}
                        <View style={styles.labelContainer}>
                            <Text style={styles.aqiLevelLabel}>{getAQILabel(marker.aqi)}</Text>
                        </View>
                        
                        {/* เนื้อหาคำแนะนำ */}
                        <View style={styles.recommendationsContainer}>
                            {recommendationItems}
                        </View>
                        
                        {/* ลูกศรชี้ไปยังมาสคอต */}
                        <View style={[styles.bubbleArrow, { borderTopColor: getBackgroundColor(marker.aqi) }]} />
                    </View>

                    {/* มาสคอต */}
                    <Image
                        source={getMascot(marker.aqi)}
                        style={styles.mascot}
                        resizeMode="contain"
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1
    },
    backgroundImage: {
        position: 'absolute',
        width: width,
        height: height,
        zIndex: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 20,
        margin: 20,
        padding: 20,
        zIndex: 10,
        borderRadius: 15,
    },
    locationWrapper: {
        flex: 1,
        marginRight: 10,
    },
    locationText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 25,
    },
    circleSection: {
        marginTop: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    circleContainerPm: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    circleRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 10, // ความหนาของวงแหวน
        position: 'absolute',
    },
    circleInner: {
        width: 120, // ขนาดวงกลมด้านใน (ต้องเล็กกว่าวงกลมด้านนอก)
        height: 120,
        borderRadius: 80,
        backgroundColor: 'white', // พื้นหลังของวงกลมด้านใน
        justifyContent: 'center',
        alignItems: 'center',
    },
    aqiValue: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    aqiUnit: {
        fontSize: 12,
        marginTop: -5,
    },
    timeText: {
        fontSize: 9,
        marginTop: 2,
    },
    mascotContainer: {
        position: 'absolute',
        bottom: 40,
        right: 0,
        left: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    mascot: {
        width: width * 0.25,
        height: 120,
        position: 'absolute',
        right: 30,
        bottom: 0,
        zIndex: 11
    },
    speechBubble: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: width * 0.3, // ให้พื้นที่ด้านขวาสำหรับมาสคอต
        padding: 15,
        borderRadius: 20,
        zIndex: 10,
    },
    bubbleArrow: {
        position: 'absolute',
        right: 20,
        bottom: -18,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 20,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        // borderTopColor จะถูกกำหนดใน inline style เพื่อให้ตรงกับสีพื้นหลังของ bubble
    },
    labelContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    aqiLevelLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    recommendationsContainer: {
        width: '100%',
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        paddingLeft: 5,
    },
    recommendationText: {
        color: '#fff',
        fontSize: 12,
        flexShrink: 1,
        lineHeight: 18,
    }
});

export default AQIModal;