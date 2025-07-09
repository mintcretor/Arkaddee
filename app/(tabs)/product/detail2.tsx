import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Linking,
    ImageSourcePropType,
} from 'react-native';
import { useTranslation } from 'react-i18next'; // Assuming you have this set up
import { Stack, useLocalSearchParams, router } from 'expo-router'; // For navigation and params

// Define a type for the data structure if not already defined globally
// This should match the ProductDetailData interface you already have,
// but potentially with more specific fields if needed for this detailed page.
interface ProductDetailData {
    title: string;
    name?: string; // e.g., 'Arkad PPV'
    tagline?: string; // e.g., 'เครื่องเติมอากาศแรงดันบวก...'
    description?: string;
    image: ImageSourcePropType;
    features?: string[]; // Not directly used here, but good to keep
    link?: string; // Link to the full product page
    subtext?: string; // You might not need this here
}

// Data for pricing table (Example structure)
interface PriceItem {
    id: string;
    model: string;
    price: string;
}

interface PriceItemR {
    id: string;
    model: string;
    price: string;
    price2: string;
    price3: string;
    price4: string;
}


// Data for filtration system (Example structure)
interface FiltrationStep {
    id: number;
    image: ImageSourcePropType;
    title: string;
    description: string;
    description2: string;
    description3: string;
    description4: string;
    description5: string;
}

// Data for specifications table (Example structure)
interface Specification {
    label: string;
    ppv160t: string;
    ppv250: string;
}
interface Specification2 {
    label: string;
    ppv160t: string;
    ppv250: string;
}
// Data for warranty items
interface WarrantyIcon {
    id: string;
    icon: ImageSourcePropType;
    label: string;
}

const { width } = Dimensions.get('window');

const ProductDetail2Page: React.FC = () => {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const product: ProductDetailData = params.product ? JSON.parse(params.product as string) : {};
    const sas = product?.description?.split(',');
    console.log();
    // Sample data for the various sections based on the image
    const pricingData: PriceItem[] = [
        { id: '1', model: 'ERV 150', price: '฿34,200' },
        { id: '2', model: 'ERV 250', price: '฿44,800' },
    ];
    const pricingfilter: PriceItemR[] = [
        { id: '1', model: 'ERV 150', price: '฿1,450', price2: '฿890', price3: '฿590', price4: '฿980' },
        { id: '2', model: 'ERV 250', price: '฿1,850', price2: '฿980', price3: '฿690', price4: '฿980' },

    ];
    const filtrationSteps: FiltrationStep[] = [
        {
            id: 1,
            image: require('@/assets/images/product/Hapa_H13.png'), // Replace with your actual filter images
            title: 'แผ่นกรอง HEPA H13 ',
            description:  '• กรองฝุ่นที่อนุภาคขนาดเล็ก ได้ถึง 99.95%',
            description2: '• ไม่สามารถล้างทำความสะอาดได้',
            description3: '• เปลี่ยนทุกๆ 1 ปี',
            description4: '',
            description5: '',
        },
        {
            id: 2,
            image: require('@/assets/images/product/Activated_Carbon.png'), // Replace with your actual filter images
            title: 'แผ่นกรอง Activated Carbon',
            description:  '• สำหรับกรองฝุ่นอนุภาคขนาดใหญ่ และขนาดกลาง',
            description2: '• กรองกลิ่นไม่พึงประสงค์',
            description3: '• สามารถถอดล้างทำความสะอาดได้',
            description4: '• ล้างทำความสะอาดทุกๆ 6 เดือน',
            description5: '• เปลี่ยนทุกๆ 2 ปี',
        },
        {
            id: 3,
            image: require('@/assets/images/product/pre_fliter.png'), // Replace with your actual filter images
            title: 'แผ่นกรอง Pre Filter',
            description:  '• สำหรับกรองฝุ่นอนุภาคขนาดใหญ่ และกันแมลง',
            description2: '• สามารถถอดล้างทำความสะอาดได้',
            description3: '• ล้างทำความสะอาดทุกๆ 6 เดือน',
            description4: '• เปลี่ยนทุกๆ 2 ปี',
            description5: '',
        },
        {
            id: 4,
            image: require('@/assets/images/product/UV lamp.png'), // Replace with your actual filter images
            title: ' หลอด UVc Lamp',
            description:  '• สำหรับฆ่าเชื้อโรคและเชื้อแบคทีเรีย',
            description2: '',
            description3: '',
            description4: '',
            description5: '',
        },
    ];

    // Inside your ProductDetailPage component, locate the `specifications` array

    const specifications: Specification[] = [
        { label: 'ขนาดห้อง', ppv160t: '32 ตร.ม.', ppv250: '50 ตร.ม.' },
        { label: 'ระดับพัดลม', ppv160t: 'HIGH | MID | LOW', ppv250: 'HIGH | MID | LOW' }, // This row combines HIGH/LOW
        { label: 'การเติมอากาศ', ppv160t: '150 cmh | 120 cmh | 250 cmh', ppv250: '200 cmh | 350 cmh | 290 cmh' },
        { label: 'การเติมอากาศ', ppv160t: '88 cfm | 70 cfm | 147 cfm', ppv250: '117 cfm | 206 cfm | 170 cfm' },
        { label: 'กำลังไฟ', ppv160t: '70 W | 65 W | 60 W', ppv250: '85 W | 75 W | 65 W' },
        { label: 'ระดับเสียง', ppv160t: '24 dB | 23 dB | 22 dB', ppv250: '31 dB | 28 dB | 25 dB' },
    ];


    const warrantyIcons: WarrantyIcon[] = [
        { id: 'warranty1', icon: require('@/assets/images/icons/icon4.png'), label: 'ตัวเครื่อง 1 ปี' }, // Replace with your actual icons
        { id: 'warranty2', icon: require('@/assets/images/icons/icon3.png'), label: 'มอเตอร์ 3 ปี' },
        { id: 'warranty3', icon: require('@/assets/images/icons/icon5.png'), label: 'จอควบคุม 1 ปี' },
    ];


    const handleContactPress = (link: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error('An error occurred', err));
        }
    };
    const description = product.description?.split(',');
    console.log('dddd',description)
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'เครื่องเติมอากาศ' }} />
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.productHeader}>
                    <Image source={product.image || require('@/assets/images/product/SNG.png')} style={styles.mainProductImage} resizeMode="contain" />
                    <Text style={styles.productName}>{product.title}</Text>
                    <Text style={styles.productTagline}>{sas[0]}</Text>
                    <Text style={styles.productDescription}> • {description[0]}</Text>
                    <Text style={styles.productDescription}> • {description[1]}</Text>
                    <Text style={styles.productDescription}> • {description[2]}</Text>
                    <Text style={styles.productDescription}> • {description[3]}</Text>

                </View>

                {/* Price Table Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.priceTable}>
                        <View style={styles.priceTableHeader}>
                            <Text style={[styles.priceTableCell, styles.headerText]}> เครื่องเติมอากาศรุ่น</Text>
                            <Text style={[styles.priceTableCell, styles.headerText]}> ราคา </Text>

                        </View>
                        {pricingData.map((item) => (
                            <View key={item.id} style={styles.priceTableRow}>
                                <Text style={styles.priceTableCell}>{item.model}</Text>
                                <Text style={styles.priceTableCell}>{item.price}</Text>

                            </View>
                        ))}

                        <View style={styles.priceTableRow}>
                            <Text style={[styles.priceTableCell2, { flex: 2 }]}> * ราคารวมภาษีมูลค่าเพิ่ม 7 % * และยังไม่รวมค่าติดตั้ง  *</Text>

                        </View>

                    </View>
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                    >
                        <Text style={styles.contactButtonText}> สั่งซื้อ / สอบถามข้อมูล @Line</Text>
                    </TouchableOpacity>
                </View>

                {/* Filtration System Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>ระบบการกรอง</Text>
                    {filtrationSteps.map((step) => (
                        <View key={step.id} style={styles.filtrationStep}>
                            <Image source={step.image} style={styles.filtrationImage} resizeMode="contain" />
                            <View style={styles.filtrationTextContent}>
                                <Text style={styles.filtrationTitle}>{step.title}</Text>
                                {/* Conditional rendering for descriptions */}
                                {step.description ? <Text style={styles.filtrationDescription}>{step.description}</Text> : null}
                                {step.description2 ? <Text style={styles.filtrationDescription}>{step.description2}</Text> : null}
                                {step.description3 ? <Text style={styles.filtrationDescription}>{step.description3}</Text> : null}
                                {step.description4 ? <Text style={styles.filtrationDescription}>{step.description4}</Text> : null}
                                {step.description5 ? <Text style={styles.filtrationDescription}>{step.description5}</Text> : null}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.sectionContainer}>
                    <View style={styles.priceTable}>
                        <View style={styles.priceTableHeader}>
                            <Text style={[styles.priceTableCell, styles.headerText]}>เครื่องเติมอากาศรุ่น</Text>
                            <Text style={[styles.priceTableCell, styles.headerText]}>HEPA H13</Text>
                            <Text style={[styles.priceTableCell, styles.headerText]}>Activated Carbon</Text>
                            <Text style={[styles.priceTableCell, styles.headerText]}>Pre-Filter</Text>
                            <Text style={[styles.priceTableCell, styles.headerText]}>หลอด UVc</Text>
                        </View>
                        {pricingfilter.map((item) => (
                            <View key={item.id} style={styles.priceTableRow}>
                                <Text style={styles.priceTableCell}>{item.model}</Text>
                                <Text style={styles.priceTableCell}>{item.price}</Text>
                                <Text style={styles.priceTableCell}>{item.price2}</Text>
                                <Text style={styles.priceTableCell}>{item.price3}</Text>
                                <Text style={styles.priceTableCell}>{item.price4}</Text>
                            </View>
                        ))}

                        <View style={styles.priceTableRow}>
                            <Text style={[styles.priceTableCell2, { flex: 2 }]}> * ราคารวมภาษีมูลค่าเพิ่ม 7 % * และยังไม่รวมค่าติดตั้ง  *</Text>

                        </View>

                    </View>

                </View>


                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}> ข้อมูลจำเพาะเครื่องเติมอากาศรุ่น </Text>
                    <Text style={styles.sectionTitle}> Energy Recovery Ventilation (ERV)</Text>
                    <View style={styles.specTable}>

                        <View style={styles.specTableHeader}>
                            <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>รุ่น</Text>
                            <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>ERV 160</Text>
                            <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>ERV 250</Text>
                        </View>

                        {specifications.map((spec, index) => (
                            <View key={index.toString()} style={styles.specTableRow}>
                                <Text style={[styles.specTableCell, { flex: 2 }]}>{spec.label}</Text>
                                <Text style={[styles.specTableCell, { flex: 2 }]}>{spec.ppv160t}</Text>
                                <Text style={[styles.specTableCell, { flex: 2 }]}>{spec.ppv250}</Text>

                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}> จอควบคุม Touch Panel</Text>
                    <Image source={require('@/assets/images/product/TouchPanel.png')} style={styles.touchPanelImage} resizeMode="contain" />
                    <View style={styles.bulletPointsContainer}>
                        <Text style={styles.bulletPoint}> • แสดงอุณหภูมิและค่าความชื้น</Text>
                        <Text style={styles.bulletPoint}> • สามารถตั้งเวลาเปิด / ปิด แบบอัตโนมัติ</Text>
                        <Text style={styles.bulletPoint}> • แสดงค่าฝุ่น PM2.5</Text>
                        <Text style={styles.bulletPoint}> • แสดงค่าฝุ่น PM10</Text>
                        <Text style={styles.bulletPoint}> • แสดงค่าคาร์บอนไดออกไซด์</Text>
                        <Text style={styles.bulletPoint}> • แจ้งเตือนให้เปลยนแผ่นกรอง HEPA</Text>
                        <Text style={styles.bulletPoint}> • เชื่อมตอ Wifi และ Application</Text>
                        <Text style={styles.bulletPoint}> • ปรับความแรงลมระบบฟอกอากาศ</Text>
                        <Text style={styles.bulletPoint}> • เก็บข้อมูลค่าฝุ่น สภาพอากาศ</Text>
                    </View>
                </View>

                {/* Warranty Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}> การรับประกัน Warranty</Text>
                    <View style={styles.warrantyIconsContainer}>
                        {warrantyIcons.map((item) => (
                            <View key={item.id} style={styles.warrantyIconItem}>
                                <Image source={item.icon} style={styles.warrantyIcon} resizeMode="contain" />
                                <Text style={styles.warrantyIconLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                    >
                        <Text style={styles.contactButtonText}> สั่งซื้อ / สอบถามข้อมูล @Line</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    productHeader: {
      alignItems:'flex-start',
        padding: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    mainProductImage: {
        width: '80%',
        height: 200,
        marginBottom: 15,
    },
    productName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 8,
        textAlign: 'center',
    },
    productTagline: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 10,
        textAlign: 'center',
    },
    productDescription: {
        fontSize: 14,
        color: '#666666',
     
        lineHeight: 22,
    },
    sectionContainer: {
        paddingHorizontal: 15,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderRadius: 10,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#333333',
    },

    // Price Table Styles
    priceTable: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    priceTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        paddingVertical: 10,
    },
    priceTableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    priceTableRowEven: {
        backgroundColor: '#F9F9F9', // For alternating row colors
    },
    priceTableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        color: '#333333',
        paddingHorizontal: 5,
    },
    priceTableCell2: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: '#333333',
        paddingHorizontal: 5,
    },
    headerText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    contactButton: {
        backgroundColor: '#28A745', // Green color for contact
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    contactButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Filtration System Styles
    filtrationStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    filtrationImage: {
        width: 80,
        height: 80,
        marginRight: 15,
    },
    filtrationTextContent: {
        flex: 1,
    },
    filtrationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    filtrationDescription: {
        fontSize: 13,
        color: '#666666',
        lineHeight: 18,
    },

    // Specifications Table Styles
    specTable: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    specTable2: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    specTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        paddingVertical: 10,
    },
    specTableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    specTableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        color: '#333333',
        paddingHorizontal: 5,
    },

    // Touch Panel Styles
    touchPanelImage: {
        width: '100%',
        height: 200, // Adjust height as needed
    },
    bulletPointsContainer: {
        paddingHorizontal: 10,
        marginTop: 20
    },
    bulletPoint: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
        marginLeft: 10,
    },

    // Warranty Section Styles
    warrantyIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    warrantyIconItem: {
        alignItems: 'center',
        width: '30%', // Adjust based on how many items per row
        marginBottom: 15,
    },
    warrantyIcon: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    warrantyIconLabel: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333333',
    },
});

export default ProductDetail2Page;