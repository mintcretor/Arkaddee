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
    Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next'; // Assuming you have this set up
import { Stack, useLocalSearchParams, router } from 'expo-router'; // For navigation and params
import { Ionicons, AntDesign } from '@expo/vector-icons';

// Define a type for the data structure if not already defined globally
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
}

// Data for filtration system (Example structure)
interface FiltrationStep {
    id: number;
    image: ImageSourcePropType;
    titleKey: string; // Changed to key for translation
    descriptionKey: string; // Changed to key for translation
    description2Key: string; // Changed to key for translation
    description3Key: string; // Changed to key for translation
    description4Key: string; // Changed to key for translation
    description5Key: string;
}

// Updated Specification interface to handle values and optional units
interface Specification {
    labelKey: string;
    ppv160t_value: string;
    ppv160t_unit_key?: string; // Optional key for unit translation
    ppv250_value: string;
    ppv250_unit_key?: string; // Optional key for unit translation
}
interface Specification2 {
    labelKey: string;
    ppv160t_value: string;
    ppv160t_unit_key?: string; // Optional key for unit translation
    ppv250_value: string;
    ppv250_unit_key?: string; // Optional key for unit translation
}
// Data for warranty items
interface WarrantyIcon {
    id: string;
    icon: ImageSourcePropType;
    labelKey: string; // Changed to key for translation
}

const { width } = Dimensions.get('window');

const ProductDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const product: ProductDetailData = params.product ? JSON.parse(params.product as string) : {};
    console.log('Product Detail Params:', params);
    // Assuming product.descriptionKey will return a comma-separated string of translatable bullet points
    const descriptionParts = product.description ? t(product.description)?.split(',') : [];

    // Sample data for the various sections based on the image
    // Prices are usually numbers, so they might not need translation unless formatted differently per locale
    const pricingData: PriceItem[] = [
        { id: '1', model: 'PPV 160', price: '23,400' },
        { id: '2', model: 'PPV 250', price: '29,700' },
        { id: '3', model: 'PPV 350', price: '37,200' },
        { id: '4', model: 'PPV 440', price: '41,500' },
    ];
    const pricingfilter: PriceItemR[] = [
        { id: '1', model: 'PPV 160', price: '฿1,550', price2: '฿1,000', price3: '฿890' },
        { id: '2', model: 'PPV 250', price: '฿1,650', price2: '฿1,150', price3: '฿890' },
        { id: '3', model: 'PPV 350', price: '฿1,850', price2: '฿1,450', price3: '฿890' },
        { id: '4', model: 'PPV 440', price: '฿2,500', price2: '฿1,800', price3: '-' },
    ];

    // Updated Filtration System Data with translation keys
    const filtrationSteps: FiltrationStep[] = [
        {
            id: 1,
            image: require('@/assets/images/product/Hapa_H13.png'),
            titleKey: 'Product.HEPA_H13',
            descriptionKey: 'ProductERV.Filters_dust_99_95',
            description2Key: 'Product.filter_not_washable', // New key
            description3Key: 'Product.filter_change_yearly', // New key
            description4Key: '', // New key
            description5Key: ''
        },
        {
            id: 2,
            image: require('@/assets/images/product/Activated_Carbon.png'),
            titleKey: 'Product.Activated_Carbon',
            descriptionKey: 'Product.filter_large_dust', // New key
            description2Key: 'Product.filter_odor', // New key
            description3Key: 'Product.filter_washable', // New key
            description4Key: 'Product.filter_wash_six_months', // New key
            description5Key: "ProductERV.filter_change_two_years"
        },
        {
            id: 3,
            image: require('@/assets/images/product/UV lamp.png'),
            titleKey: 'Product.UVc_Lamp',
            descriptionKey: 'Product.filter_uvc_description', // New key
            description2Key: '', // No translation needed if empty
            description3Key: '',
            description4Key: '',
            description5Key: ''

        },
    ];
    const getTouchPanelImage = () => {
        const currentLanguage = i18n.language; // Gets the active language code (e.g., 'th', 'en')

        switch (currentLanguage) {
            case 'th':
                return require('@/assets/images/product/Touch_Panel_th.png');
            case 'en':
                return require('@/assets/images/product/Touch_Panel_en.png');
            default:
                // Always provide a fallback image for unsupported or missing languages
                return require('@/assets/images/product/Touch_Panel_en.png');
        }
    };
    // Updated Specifications Data with translation keys and separate values/units
    const specifications: Specification[] = [
        { labelKey: 'Product.room_size', ppv160t_value: '32', ppv160t_unit_key: 'Product.sq_m', ppv250_value: '50', ppv250_unit_key: 'Product.sq_m' },
        { labelKey: 'Product.fan_level', ppv160t_value: 'HIGH | LOW', ppv250_value: 'HIGH | LOW' },
        { labelKey: 'Product.air_delivery', ppv160t_value: '160 | 120', ppv160t_unit_key: 'Product.cmh', ppv250_value: '250 | 200', ppv250_unit_key: 'Product.cmh' },
        { labelKey: 'Product.air_delivery_cfm', ppv160t_value: '88 | 70', ppv160t_unit_key: 'Product.cfm', ppv250_value: '147 | 117', ppv250_unit_key: 'Product.cfm' },
        { labelKey: 'Product.power', ppv160t_value: '45 | 30', ppv160t_unit_key: 'Product.watt', ppv250_value: '60 | 50', ppv250_unit_key: 'Product.watt' },
        { labelKey: 'Product.noise_level', ppv160t_value: '55 | 50', ppv160t_unit_key: 'Product.decibel', ppv250_value: '57 | 52', ppv250_unit_key: 'Product.decibel' },
    ];

    const specifications2: Specification2[] = [
        { labelKey: 'Product.room_size', ppv160t_value: '60', ppv160t_unit_key: 'Product.sq_m', ppv250_value: '90', ppv250_unit_key: 'Product.sq_m' },
        { labelKey: 'Product.fan_level', ppv160t_value: 'HIGH | LOW', ppv250_value: 'HIGH | LOW' },
        { labelKey: 'Product.air_delivery', ppv160t_value: '350 | 290', ppv160t_unit_key: 'Product.cmh', ppv250_value: '440 | 350', ppv250_unit_key: 'Product.cmh' },
        { labelKey: 'Product.air_delivery_cfm', ppv160t_value: '206 | 170', ppv160t_unit_key: 'Product.cfm', ppv250_value: '258 | 206', ppv250_unit_key: 'Product.cfm' },
        { labelKey: 'Product.power', ppv160t_value: '75 | 55', ppv160t_unit_key: 'Product.watt', ppv250_value: '85 | 70', ppv250_unit_key: 'Product.watt' },
        { labelKey: 'Product.noise_level', ppv160t_value: '60 | 55', ppv160t_unit_key: 'Product.decibel', ppv250_value: '67 | 60', ppv250_unit_key: 'Product.decibel' },
    ];

    // Updated Warranty Icons Data with translation keys
    const warrantyIcons: WarrantyIcon[] = [
        { id: 'warranty1', icon: require('@/assets/images/icons/icon4.png'), labelKey: 'Product.warranty_body' },
        { id: 'warranty2', icon: require('@/assets/images/icons/icon3.png'), labelKey: 'Product.warranty_motor' },
        { id: 'warranty3', icon: require('@/assets/images/icons/icon5.png'), labelKey: 'Product.warranty_control_panel' },
    ];

    const handleContactPress = (link: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error('An error occurred', err));
        }
    };

    return (

        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
               backgroundColor="#ffffff"
               translucent={true}
            />
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ title: t('Product.Aerator') }} />
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{product.title}</Text>
                    <View style={styles.placeholder} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>

                    <View style={styles.productHeader}>
                        <View style={[{ alignItems: 'center' }]}>
                            <Image source={require('@/assets/images/product/PPV.png')} style={styles.mainProductImage} resizeMode="contain" />
                        </View>
                        <Text style={styles.productName}>{product.title}</Text>
                        {product.tagline ? <Text style={styles.productTagline}>{product.tagline}</Text> : null}
                        {descriptionParts.map((part, index) => (
                            <Text key={index} style={styles.productDescription}>• {t(part.trim())}</Text>

                        ))}
                    </View>


                    <View style={styles.sectionContainer}>
                        <View style={styles.priceTable}>
                            <View style={styles.priceTableHeader}>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.Aerator_model')} </Text>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.price')} </Text>
                            </View>
                            {pricingData.map((item) => (
                                <View key={item.id} style={styles.priceTableRow}>
                                    <Text style={styles.priceTableCell}>{item.model}</Text>
                                    <Text style={styles.priceTableCell}>{item.price}</Text>
                                </View>
                            ))}
                            <View style={styles.priceTableRow}>
                                <Text style={[styles.priceTableCell2, { flex: 2 }]}> * {t('Product.note_vat')} *</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                        >
                            <Text style={styles.contactButtonText}> {t('Product.Additional_information_order')}</Text>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{t('Product.system_filter')}</Text>
                        {filtrationSteps.map((step) => (
                            <View key={step.id} style={styles.filtrationStep}>
                                <Image source={step.image} style={styles.filtrationImage} resizeMode="contain" />
                                <View style={styles.filtrationTextContent}>
                                    <Text style={styles.filtrationTitle}>{t(step.titleKey)}</Text>
                                    <Text style={styles.filtrationDescription}> • {t(step.descriptionKey)}</Text>
                                    {step.description2Key ? <Text style={styles.filtrationDescription}> • {t(step.description2Key)}</Text> : null}
                                    {step.description3Key ? <Text style={styles.filtrationDescription}> • {t(step.description3Key)}</Text> : null}
                                    {step.description4Key ? <Text style={styles.filtrationDescription}> • {t(step.description4Key)}</Text> : null}
                                    {step.description5Key ? <Text style={styles.filtrationDescription}> • {t(step.description5Key)}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </View>


                    <View style={styles.sectionContainer}>
                        <View style={styles.priceTable}>
                            <View style={styles.priceTableHeader}>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.Aerator_model')}</Text>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.HEPA_H13')} </Text>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.Activated_Carbon')} </Text>
                                <Text style={[styles.priceTableCell, styles.headerText]}> {t('Product.UVc_Lamp')} </Text>
                            </View>
                            {pricingfilter.map((item) => (
                                <View key={item.id} style={styles.priceTableRow}>
                                    <Text style={styles.priceTableCell}>{item.model}</Text>
                                    <Text style={styles.priceTableCell}>{item.price}</Text>
                                    <Text style={styles.priceTableCell}>{item.price2}</Text>
                                    <Text style={styles.priceTableCell}>{item.price3}</Text>
                                </View>
                            ))}
                            <View style={styles.priceTableRow}>
                                <Text style={[styles.priceTableCell2, { flex: 2 }]}> * {t('Product.note_vat')} *</Text>
                            </View>
                        </View>
                    </View>


                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}> {t('Product.specifications_title')}</Text>
                        <View style={styles.specTable}>
                            <View style={styles.specTableHeader}>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>{t('Product.model_label')}</Text>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>PPV 160</Text>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>PPV 250</Text>
                            </View>
                            {specifications.map((spec, index) => (
                                <View key={index.toString()} style={styles.specTableRow}>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {t(spec.labelKey)}
                                    </Text>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {spec.ppv160t_value} {spec.ppv160t_unit_key ? t(spec.ppv160t_unit_key) : ''}
                                    </Text>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {spec.ppv250_value} {spec.ppv250_unit_key ? t(spec.ppv250_unit_key) : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.specTable2}>
                            <View style={styles.specTableHeader}>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>{t('Product.model_label')}</Text>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>PPV 350</Text>
                                <Text style={[styles.specTableCell, styles.headerText, { flex: 2 }]}>PPV 440</Text>
                            </View>
                            {specifications2.map((spec, index) => (
                                <View key={index.toString()} style={styles.specTableRow}>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {t(spec.labelKey)}
                                    </Text>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {spec.ppv160t_value} {spec.ppv160t_unit_key ? t(spec.ppv160t_unit_key) : ''}
                                    </Text>
                                    <Text style={[styles.specTableCell, { flex: 2 }]}>
                                        {spec.ppv250_value} {spec.ppv250_unit_key ? t(spec.ppv250_unit_key) : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>


                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}> {t('Product.touch_panel_title')}</Text>
                        <Image source={getTouchPanelImage()} style={styles.touchPanelImage} resizeMode="contain" />
                        <View style={styles.bulletPointsContainer}>
                            <Text style={styles.bulletPoint}> • {t('Product.touch_panel_auto_on_off')}</Text>
                            <Text style={styles.bulletPoint}> • {t('Product.touch_panel_hepa_alert')}</Text>
                            <Text style={styles.bulletPoint}> • {t('Product.touch_panel_wifi_app')}</Text>
                            <Text style={styles.bulletPoint}> • {t('Product.touch_panel_fan_speed')}</Text>
                        </View>
                    </View>

                    {/* Warranty Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}> {t('Product.warranty_title')}</Text>
                        <View style={styles.warrantyIconsContainer}>
                            {warrantyIcons.map((item) => (
                                <View key={item.id} style={styles.warrantyIconItem}>
                                    <Image source={item.icon} style={styles.warrantyIcon} resizeMode="contain" />
                                    <Text style={styles.warrantyIconLabel}>{t(item.labelKey)}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => handleContactPress('https://line.me/R/ti/p/@975ruzwr')}
                        >
                            <Text style={styles.contactButtonText}> {t('Product.order_inquire_line')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        marginTop: Platform.OS === 'ios' ? 35 : 25, // Adjust if necessary
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
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
    }, backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        textAlign: 'center',
    },
    countText: {
        fontSize: 14,
        color: '#666',
        minWidth: 40,
        textAlign: 'right',
    },
    placeholder: {
        width: 40,
    },
    productHeader: {
        // alignItems: 'center',
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
        //textAlign: 'center',
        alignContent: 'flex-start',
        alignItems: 'flex-start',
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
        color: '#333333', // Explicitly set color for consistency
        paddingHorizontal: 5,
    },
    priceTableCell2: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: '#333333', // Explicitly set color for consistency
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
        color: '#333333', // Explicitly set color for consistency
        marginBottom: 4,
    },
    filtrationDescription: {
        fontSize: 13,
        color: '#666666', // Explicitly set color for consistency
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
        color: '#333333', // Explicitly set color for consistency
        paddingHorizontal: 5,
    },

    // Touch Panel Styles
    touchPanelImage: {
        width: '100%',
        height: 200, // Adjust height as needed
    },
    bulletPointsContainer: {
        marginTop: 50,
        paddingHorizontal: 10,
    },
    bulletPoint: {
        fontSize: 14,
        color: '#333333', // Explicitly set color for consistency
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
        color: '#333333', // Explicitly set color for consistency
    },
});

export default ProductDetailPage;
