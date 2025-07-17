import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  InteractionManager,
  Animated,
  Platform,
  Alert, // Note: Alert will not function in the web-based Canvas preview.
} from 'react-native';
// Import Region type for better type safety
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps'; // PROVIDER_GOOGLE requires a development build.
import AQIModal from '@/components/AQIModal';
import { useLocation } from '@/utils/LocationContext';
import BeautifulLoadingScreen from '@/components/BeautifulLoadingScreen';
import * as Location from 'expo-location';
import { Linking } from 'react-native'; // Linking.openSettings() will not function in the web-based Canvas preview.

// Import separated components
import AQIMarker from '@/components/map/AQIMarker';
import MapControls from '@/components/map/MapControls';
import DataProviderFactory from '@/services/DataProviders/DataProviderFactory';
import AQIRankingModal from '@/components/AQIRankingModal'; // Added ranking modal import
import { useTranslation } from 'react-i18next';

const AirQualityScreen = () => { // Renamed from AQIMap to AirQualityScreen for clarity as it's now the route component
  const mapRef = useRef<MapView | null>(null); // Added type for mapRef
  const [aqiPoints, setAqiPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  // FIX: Explicitly type 'region' state to be either 'Region' or 'null'
  const [region, setRegion] = useState<Region | null>(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  // Fix: Explicitly set initial value to false
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useLocation();
  const isLoadingRef = useRef(false);
  const apiSourceRef = useRef('default');
  const regionChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Added type for setTimeout ref
  const [apiSource, setApiSource] = useState('default');
  const dataFetchedRef = useRef(false);
  const { t } = useTranslation();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("กำลังโหลดแผนที่..."); // Initial message in Thai
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const availableApiSources = DataProviderFactory.getAvailableProviders();

  // State for ranking modal
  const [isRankingModalVisible, setIsRankingModalVisible] = useState(false);

  // Use location from LocationContext
useEffect(() => {
  let mounted = true;
  let locationProgress = 0;
  let progressInterval: ReturnType<typeof setInterval> | null = null; // Type for setInterval

  const initializeMap = async () => {
    try {
      // ... (loading message and progress updates)

      if (location) {
        const initialRegion: Region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        if (mounted) {
          setRegion(initialRegion); // <-- setState
        }
      } else if (locationError || !locationLoading) {
        const defaultRegion: Region = {
          latitude: 18.7883,
          longitude: 98.9853,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        if (mounted) {
          setRegion(defaultRegion); // <-- setState
        }
      }

      // THIS BLOCK IS PROBLEMATIC
      if (region && mounted) { // 'region' is a dependency, and you're setting it inside this effect
        setLoadingMessage(t('airQuality.loadingLocation'));
        setLoadingProgress(0.4);

        progressInterval = setInterval(() => {
          if (locationProgress < 0.9) {
            locationProgress += 0.1;
            setLoadingProgress(locationProgress);
          } else {
            if (progressInterval) clearInterval(progressInterval);
          }
        }, 500);
      }
    } catch (error) {
      // ... (error handling)
    }
  };

  initializeMap(); // Call the async function

  return () => {
    mounted = false;
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }
    if (progressInterval) { // Clear the interval on unmount
      clearInterval(progressInterval);
    }
  };
}, [location, locationLoading, locationError, region, t]);  // Added 'region' and 't' to dependencies

  // Load AQI data after map is ready
  useEffect(() => {
    // Only fetch data if region is not null, data hasn't been fetched, and no other loading is in progress
    if (region && !dataFetchedRef.current && !isLoadingRef.current) {
      dataFetchedRef.current = true; // Mark as data fetch initiated
      fetchAQIData();
    }
  }, [region]); // Dependency on 'region' ensures this runs when region is set

  // Detect apiSource changes
  useEffect(() => {
    apiSourceRef.current = apiSource;
    if (dataFetchedRef.current) { // Only refetch if data was already fetched at least once
      setAqiPoints([]); // Clear current points to show loading
      // Use InteractionManager to ensure UI is responsive before starting heavy fetch
      InteractionManager.runAfterInteractions(() => {
        fetchAQIData();
      });
    }
  }, [apiSource]);

  const getApiSourceName = useCallback(() => { // Memoize this function
    try {
      return DataProviderFactory.getProviderName(apiSource);
    } catch (error) {
      console.error('Error getting API source name:', error);
      return t('airQuality.unknownSource');
    }
  }, [apiSource, t]);

  // Function to toggle API source
  const toggleApiSource = useCallback(() => {
    if (isLoadingRef.current) {
      Alert.alert(
        t('common.loading'),
        t('common.loadingInProgress'),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    try {
      const currentIndex = availableApiSources.findIndex(src => src.id === apiSource);
      const nextIndex = (currentIndex + 1) % availableApiSources.length;
      setIsDataLoading(true);
      const newApiSource = availableApiSources[nextIndex].id;
      setApiSource(newApiSource);
      apiSourceRef.current = newApiSource;
    } catch (error) {
      console.error('Error toggling API source:', error);
      Alert.alert(
        t('common.error'),
        t('common.errorLoadingData', { error: error.message || 'Unknown reason' }), // Translated error message
        [{ text: t('common.ok'), style: 'default' }]
      );
      setIsDataLoading(false);
    }
  }, [apiSource, availableApiSources, t]); // Removed isLoadingRef.current from dependencies as it's a ref

  // Function to open ranking modal
  const handleOpenRanking = useCallback(() => {
    // Check if there is data on the map
    if (aqiPoints.length === 0 && !isDataLoading) {
      Alert.alert(
        t('airQuality.noData'),
        t('airQuality.noDataAvailable', { source: getApiSourceName() }),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    // Open ranking modal
    setIsRankingModalVisible(true);
  }, [aqiPoints.length, isDataLoading, getApiSourceName, t]);

  // Function to fetch AQI data using DataProvider
  const fetchAQIData = useCallback(async () => { // Memoize fetchAQIData
    if (isLoadingRef.current) {
      console.log("fetchAQIData is already running. Skipping duplicate call.");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null; // Type for setTimeout ID

    try {
      isLoadingRef.current = true;
      setIsDataLoading(true);
      setLoadingMessage(t('airQuality.loadingData'));
      setLoadingProgress(0.7);

      const currentApiSource = apiSourceRef.current;
      const dataProvider = DataProviderFactory.getProvider(currentApiSource);
      if (!dataProvider || typeof dataProvider.fetchData !== 'function') {
        throw new Error(t('airQuality.invalidDataProvider', { source: currentApiSource }));
      }
      const formattedData = await dataProvider.fetchData();

      setLoadingProgress(0.8);

      // Check if the user changed API source during loading
      if (currentApiSource !== apiSourceRef.current) {
        //console.log(`apiSource changed during loading: ${currentApiSource} -> ${apiSourceRef.current}`);
        // Do not throw error - but skip state update
        return;
      }

      // Check if there is enough data to display
      if (!formattedData || formattedData.length === 0) {
        //console.warn(`No data found for API: ${currentApiSource}`);
        Alert.alert(
          t('airQuality.noData'),
          t('airQuality.noDataAvailable', { source: getApiSourceName() }),
          [{ text: t('common.ok'), style: 'default' }]
        );
        // Keep existing data if any
        if (aqiPoints.length === 0) {
          // If no existing data, set to empty array
          setAqiPoints([]);
        }
      } else {
        // Set new data
        setAqiPoints(formattedData);
        // console.log(`Data loaded successfully: ${formattedData.length} points`);
      }

      setLoadingProgress(1);

      // Set timeout to hide loading screen
      timeoutId = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setIsLoading(false);
        });
      }, 500);

    } catch (error: any) { // Explicitly type error as 'any' or 'Error'
      console.error('Error fetching AQI data:', error);
      // Display alert message
      setLoadingMessage(t('airQuality.errorLoadingData', { error: error.message || 'Unknown reason' }));

      // Display Alert instead of throwing
      Alert.alert(
        t('airQuality.error'),
        t('airQuality.errorLoadingData', { error: error.message || 'Unknown reason' }),
        [{ text: t('common.ok'), style: 'default' }]
      );

      // If no existing data, set to empty array
      if (aqiPoints.length === 0) {
        setAqiPoints([]);
      }

      timeoutId = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setIsLoading(false);
        });
      }, 1000);
    } finally {
      // Cleanup
      setIsDataLoading(false);
      isLoadingRef.current = false;
    }

    // No need to return cleanup function here, as it's part of the useEffect's return
    // This function is called directly, not within a useEffect that expects a cleanup.
  }, [aqiPoints.length, fadeAnim, getApiSourceName, t]); // Added dependencies for useCallback

  // Function to handle region change
  const handleRegionChange = useCallback((newRegion: Region) => { // Type newRegion as Region
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }

    regionChangeTimeoutRef.current = setTimeout(() => {
      // Only update region if it's significantly different to avoid excessive re-renders
      if (region) {
        const latDiff = Math.abs(newRegion.latitude - region.latitude);
        const lngDiff = Math.abs(newRegion.longitude - region.longitude);
        const deltaLatDiff = Math.abs(newRegion.latitudeDelta - region.latitudeDelta);

        // A threshold to determine "significant" change
        const threshold = 0.001; // Adjust as needed

        if (latDiff > threshold || lngDiff > threshold || deltaLatDiff > threshold) {
          setRegion(newRegion);
        }
      } else {
        // If region is null (initial load), always set it
        setRegion(newRegion);
      }

      regionChangeTimeoutRef.current = null;
    }, 300);
  }, [region]); // Dependency on 'region'

  // Function to handle marker press
  const handleMarkerPress = useCallback((marker: any) => { // Type marker as any for now, or define a specific type
    if (marker && marker.id) {
      // Fix: Check marker data before showing modal
      InteractionManager.runAfterInteractions(() => {
        //console.log('Marker pressed:', marker.id);
        setSelectedMarker(marker);
        setIsModalVisible(true);
      });
    }
  }, []);

  // Function to skip location loading
  const skipLocationLoading = useCallback(() => { // Memoize skipLocationLoading
    const defaultRegion: Region = { // Explicitly type defaultRegion as Region
      latitude: 18.7883,
      longitude: 98.9853,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
    setRegion(defaultRegion);
    setLoadingProgress(0.4);
    setLoadingMessage(t('airQuality.loadingSkipped'));
  }, [t]);

  // Function to go to current location
  const goToCurrentLocation = useCallback(async () => {
    try {
      setIsDataLoading(true);

      // Check permission status
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Request permission if not granted
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

        if (newStatus !== 'granted') {
          Alert.alert(
            t('airQuality.permissionDenied'),
            t('airQuality.permissionDeniedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.settings'),
                onPress: () => Linking.openSettings()
              }
            ]
          );
          setIsDataLoading(false);
          return;
        }
      }

      // Check if GPS is enabled
      const providerStatus = await Location.getProviderStatusAsync();

      if (!providerStatus.locationServicesEnabled) {
        Alert.alert(
          t('airQuality.gpsDisabled'),
          t('airQuality.gpsDisabledMessage'),
          [{ text: t('common.ok'), style: 'default' }]
        );
        setIsDataLoading(false);
        return;
      }

      if (location && location.latitude && location.longitude) {
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } else {
        // Try refreshing location
        await refreshLocation();

        setTimeout(() => {
          if (location && location.latitude && location.longitude) {
            mapRef.current?.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 1000);
          } else {
            Alert.alert(
              t('airQuality.locationError'),
              t('airQuality.locationErrorMessage'),
              [{ text: t('common.ok'), style: 'default' }]
            );
          }
        }, 1000);
      }
    } catch (error: any) { // Explicitly type error as 'any' or 'Error'
      console.error('Error going to current location:', error);
      Alert.alert(
        t('airQuality.locationError'),
        t('airQuality.locationErrorMessage', { error: error.message || 'Unknown reason' }),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setIsDataLoading(false);
    }
  }, [location, refreshLocation, t]);

  // Display beautiful loading screen
  if (isLoading || !region) { // Ensure map is not rendered until 'region' is set
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <BeautifulLoadingScreen
          progress={loadingProgress}
          message={loadingMessage}
        />
        {loadingProgress <= 0.3 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipLocationLoading}
          >
            <Text style={styles.skipButtonText}>{t('airQuality.skiplocation')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region} // 'region' is guaranteed to be a 'Region' object here
        showsUserLocation={true}
        onRegionChangeComplete={handleRegionChange}
        maxZoomLevel={16}
        minZoomLevel={5}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        zoomControlEnabled={false}
        mapType="standard"
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        loadingEnabled={true}
        loadingIndicatorColor="#2196F3"
        loadingBackgroundColor="#FFFFFF"
        provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
      >
        {aqiPoints.length > 0 && aqiPoints.map((point, index) => (
          <AQIMarker
            key={point.id || `marker-${index}`}
            point={point}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      <MapControls
        isDataLoading={isDataLoading}
        apiSource={apiSource}
        getApiSourceName={getApiSourceName}
        toggleApiSource={toggleApiSource}
        goToCurrentLocation={goToCurrentLocation}
        fetchAQIData={fetchAQIData}
        aqiPoints={aqiPoints}
        onOpenRanking={handleOpenRanking}
      />

      {/* Modal to display AQI point details */}
      {/* Fix: Ensure modal only shows when a marker is selected and visible status is true */}
      {selectedMarker && ( // Render only if selectedMarker exists
        <AQIModal
          visible={isModalVisible}
          marker={selectedMarker}
          onClose={() => {
            // Fix: Explicitly reset state when closing modal
            setIsModalVisible(false);
            setSelectedMarker(null);
          }}
          position="top"
        />
      )}

      {/* Modal to display AQI ranking */}
      <AQIRankingModal
        visible={isRankingModalVisible}
        onClose={() => setIsRankingModalVisible(false)}
        aqiPoints={aqiPoints}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    marginTop: 40
  },
  skipButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default React.memo(AirQualityScreen);