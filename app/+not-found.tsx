// app/[...unmatched].tsx
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function UnmatchedRoute() {
  const { t } = useTranslation();
  // แสดงหน้า loading สั้นๆ ก่อนนำทางไปหน้าหลัก
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('favorite.Navigation')}</Text>
      <ActivityIndicator size="large" color="#4A6FA5" style={styles.spinner} />
      <Redirect href="/(tabs)/home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 10,
  },
});