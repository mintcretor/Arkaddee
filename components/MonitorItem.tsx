import React from 'react';
import { StyleSheet, View, Text, Image, ImageSourcePropType } from 'react-native';

// Define the props for MonitorItem component
interface MonitorItemProps {
  title: string;
  description: string;
  subtext: string;
  image: ImageSourcePropType;
}

const MonitorItem: React.FC<MonitorItemProps> = ({ title, description, subtext, image }) => {
  return (
    <View style={styles.monitorItem}>
      <View style={styles.monitorImage}>
        <Image source={image} style={styles.qualityImage} resizeMode="contain" />
      </View>
      <View style={styles.monitorContent}>
        <Text style={styles.monitorTitle}>{title}</Text>
        <Text style={styles.monitorDescription}>{description}</Text>
        <Text style={styles.monitorSubtext}>{subtext}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monitorItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  monitorImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qualityImage: {
    width: '80%',
    height: '80%',
  },
  monitorContent: {
    alignItems: 'center',
  },
  monitorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 6,
  },
  monitorDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  monitorSubtext: {
    fontSize: 12,
    color: '#666666',
  },
});

export default MonitorItem;