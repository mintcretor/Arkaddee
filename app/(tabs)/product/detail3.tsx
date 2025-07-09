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

// New interfaces for the added data
interface AirQualityParameter {
    id: string;
    nameKey: string; // Key for the name in translation
    descriptionKey: string; // Key for the description in translation
}

interface SpecificDataItem {
    parameterKey: string; // Key for the parameter label in translation
    range: string;
    accuracy: string;
    resolution: string;
}

interface ProductDetailItem {
    labelKey: string; // Key for the label in translation
    value: string;
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

const ProductDetail3Page: React.FC = () => {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const product: ProductDetailData = params.product ? JSON.parse(params.product as string) : {};
    const sas = product?.description?.split(',');
    console.log();
    // Sample data for the various sections based on the image
    const pricingData: PriceItem[] = [
    
        { id: '1',  price: '฿6,500' }
    ];


    // Inside your ProductDetailPage component, locate the `specifications` array


    // UPDATED: Using translation keys for name and description
    const airQualityParameters: AirQualityParameter[] = [
        { id: '1', nameKey: 'AirQuality.AQI_Name', descriptionKey: 'AirQuality.AQI_Desc' },
        { id: '2', nameKey: 'AirQuality.PM2_5_Name', descriptionKey: 'AirQuality.PM2_5_Desc' },
        { id: '3', nameKey: 'AirQuality.PM10_Name', descriptionKey: 'AirQuality.PM10_Desc' },
        { id: '4', nameKey: 'AirQuality.HCHO_Name', descriptionKey: 'AirQuality.HCHO_Desc' },
        { id: '5', nameKey: 'AirQuality.TVOC_Name', descriptionKey: 'AirQuality.TVOC_Desc' },
        { id: '6', nameKey: 'AirQuality.CO2_Name', descriptionKey: 'AirQuality.CO2_Desc' },
        { id: '7', nameKey: 'AirQuality.Temp_Name', descriptionKey: 'AirQuality.Temp_Desc' },
        { id: '8', nameKey: 'AirQuality.HUM_Name', descriptionKey: 'AirQuality.HUM_Desc' }
    ];

    // UPDATED: Using translation keys for parameter label
    const specificData: SpecificDataItem[] = [
        { parameterKey: 'AirQuality.CO2_Name', range: '400-5000 ppm', accuracy: '±50 ppm', resolution: '1 ppm' },
        { parameterKey: 'AirQuality.PM2_5_Name', range: '0-999 µg/m³', accuracy: '±5 µg/m³', resolution: '1 µg/m³' },
        { parameterKey: 'AirQuality.HCHO_Name', range: '0.000-1.999 mg/m³', accuracy: '±0.02 mg/m³', resolution: '0.001 mg/m³' },
        { parameterKey: 'AirQuality.TVOC_Name', range: '0.000-9.999 mg/m³', accuracy: '±0.02 mg/m³', resolution: '0.001 mg/m³' },
        { parameterKey: 'AirQuality.Temp_Name', range: '-10 - 50 °C', accuracy: '±1 °C', resolution: '0.1 °C' },
        { parameterKey: 'AirQuality.HUM_Name', range: '20%-85% RH', accuracy: '±4% RH', resolution: '1% RH' }
    ];

    // UPDATED: Using translation keys for product details labels
    const productDetails: ProductDetailItem[] = [
        { labelKey: 'ProductDetail.ProductSize', value: '19.05 x 7.87 x 4.06 cm' },
        { labelKey: 'ProductDetail.ProductWeight', value: '340.19 g' },
        { labelKey: 'ProductDetail.DisplayMethod', value: 'LED Screen' },
        { labelKey: 'ProductDetail.Power', value: 'Lithium battery with 3000 mAh capacity; 5V DC power charging via micro USB port' },
        { labelKey: 'ProductDetail.SetIncludes', value: 'Air Quality Monitor x 1, Micro USB charging cable x 1, English Manual x 1' }
    ];

    const warrantyIcons: WarrantyIcon[] = [
        { id: 'warranty1', icon: require('@/assets/images/icons/icon4.png'), label: t('Product.warranty_body') }, // Replace with your actual icons
    ];


    const handleContactPress = (link: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error('An error occurred', err));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: sas[0] }} />
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.productHeader}>
                    <Image source={product.image || require('@/assets/images/product/SNG.png')} style={styles.mainProductImage} resizeMode="contain" />
                    <Text style={styles.productName}>{product.title}</Text>
                    <Text style={styles.productTagline}>{sas[0]}</Text>
                    <Text style={styles.productDescription}>{product.description || t('ProductDetail.DescriptionLong')}</Text>
                </View>

                {/* Price Table Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.priceTable}>
                        <View style={styles.priceTableHeader}>
                            
                                <Text style={[styles.priceTableCell, styles.headerText]}>{t('ProductDetail.Price')}</Text>

                        </View>
                        {pricingData.map((item) => (
                            <View key={item.id} style={styles.priceTableRow}>
                            
                                <Text style={styles.priceTableCell}>{item.price}</Text>

                            </View>
                        ))}

                        <View style={styles.priceTableRow}>
                            <Text style={[styles.priceTableCell2, { flex: 2 }]}> * {t('Product.note_vat2')}  *</Text>

                        </View>

                    </View>
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                    >
                        <Text style={styles.contactButtonText}> {t('ProductERV.order_inquire_line')}</Text>
                    </TouchableOpacity>
                </View>

                {/* New Section: Air Quality Parameters - UPDATED FOR TRANSLATIONS */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{t('ProductDetail.AirQualityParametersTitle')}</Text>
                    {airQualityParameters.map((param) => (
                        <View key={param.id} style={styles.parameterItem}>
                            <Text style={styles.parameterName}>{param.id}. [{t(param.nameKey)}]</Text>
                            <Text style={styles.parameterDescription}>{t(param.descriptionKey)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{t('ProductDetail.SpecificDataTitle')}</Text>
                    <View style={styles.specDataTable}>
                        <View style={styles.specDataHeader}>
                            <Text style={[styles.specDataCell, styles.headerText]}>{t('ProductDetail.Parameter')}</Text>
                            <Text style={[styles.specDataCell, styles.headerText]}>{t('ProductDetail.MeasurementRange')}</Text>
                            <Text style={[styles.specDataCell, styles.headerText]}>{t('ProductDetail.Accuracy')}</Text>
                            <Text style={[styles.specDataCell, styles.headerText]}>{t('ProductDetail.Resolution')}</Text>
                        </View>
                        {specificData.map((item, index) => (
                            <View key={index} style={styles.specDataRow}>
                                <Text style={styles.specDataCell}>{t(item.parameterKey)}</Text>
                                <Text style={styles.specDataCell}>{item.range}</Text>
                                <Text style={styles.specDataCell}>{item.accuracy}</Text>
                                <Text style={styles.specDataCell}>{item.resolution}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{t('ProductDetail.ProductDetailsTitle')}</Text>
                    <View style={styles.productDetailsTable}>
                        {productDetails.map((item, index) => (
                            <View key={index} style={styles.productDetailsRow}>
                                <Text style={styles.productDetailsLabel}>{t(item.labelKey)}</Text>
                                <Text style={styles.productDetailsValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{t('ProductDetail.WarrantyTitle')}</Text>
                    <View style={styles.warrantyIconsContainer}>
                        {warrantyIcons.map((item) => (
                            <View key={item.id} style={styles.warrantyIconItem}>
                                <Image source={item.icon} style={styles.warrantyIcon} />
                                <Text style={styles.warrantyIconLabel}>{item.label}</Text> 
                                 </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                    >
                        <Text style={styles.contactButtonText}>{t('ProductERV.order_inquire_line')}</Text>
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
        alignItems: 'center',
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
        textAlign: 'center',
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

    // New styles for the added sections
    parameterItem: {
        marginBottom: 10,
    },
    parameterName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    parameterDescription: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
        marginLeft: 10, // Indent description
    },

    specDataTable: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    specDataHeader: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        paddingVertical: 10,
    },
    specDataRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    specDataCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: '#333333',
        paddingHorizontal: 5,
    },

    productDetailsTable: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    productDetailsRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    productDetailsLabel: {
        flex: 0.4,
        fontWeight: 'bold',
        fontSize: 13,
        color: '#333333',
        paddingLeft: 10,
    },
    productDetailsValue: {
        flex: 0.6,
        fontSize: 13,
        color: '#666666',
        paddingRight: 10,
    },
    bulletPointsContainer: {
        paddingHorizontal: 10,
    },
    bulletPoint: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
        marginLeft: 10,
    },

    // Warranty Section Styles (Existing)
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

export default ProductDetail3Page;