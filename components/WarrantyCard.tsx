import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, Linking, ImageSourcePropType } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

// Define the props for WarrantyCard component
interface WarrantyCardProps {
  title: string;
  period?: string; // period is optional
  iconSrc: ImageSourcePropType;
  wider: boolean;
  link?: string; // link is optional
  pdfUrl?: string; // pdfUrl is optional
}

const WarrantyCard: React.FC<WarrantyCardProps> = ({ title, period, iconSrc, wider, link, pdfUrl }) => {
  const handlePress = async () => {
    const urlToOpen = pdfUrl || link;

    if (urlToOpen) {
      try {
        await WebBrowser.openBrowserAsync(urlToOpen);
      } catch (error) {
        console.error('ไม่สามารถเปิด URL ได้:', error);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.warrantyCard, wider && styles.widerCard]}
      onPress={handlePress}
      disabled={!link && !pdfUrl}
      activeOpacity={link || pdfUrl ? 0.7 : 1}
    >
      <View style={styles.cardIcon}>
        <Image source={iconSrc} style={styles.iconImg} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        {period && <Text style={styles.cardPeriod}>{period}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  warrantyCard: {
    width: width / 3 - 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    margin: 6,
  },
  widerCard: {
    width: width / 2 - 30,
  },
  cardIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#EBF5FF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconImg: {
    width: 36,
    height: 36,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardPeriod: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default WarrantyCard;