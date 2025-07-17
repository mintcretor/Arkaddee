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
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import AQIModal from '@/components/AQIModal';
import { useLocation } from '@/utils/LocationContext';
import BeautifulLoadingScreen from '@/components/BeautifulLoadingScreen';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

// Import separated components
import AQIMarker from '@/components/map/AQIMarker';
import MapControls from '@/components/map/MapControls';
import DataProviderFactory from '@/services/DataProviders/DataProviderFactory';
import AQIRankingModal from '@/components/AQIRankingModal';
import { useTranslation } from 'react-i18next';

const AirQualityScreen = () => {
  const mapRef = useRef(null);
  const [aqiPoints, setAqiPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [region, setRegion] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useLocation();
  const isLoadingRef = useRef(false);
  const apiSourceRef = useRef('default');
  const regionChangeTimeoutRef = useRef(null);
  const [apiSource, setApiSource] = useState('default');
  const dataFetchedRef = useRef(false);
  const { t } = useTranslation();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("กำลังโหลดแผนที่...");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const availableApiSources = DataProviderFactory.getAvailableProviders();
  
  // Add timeout refs for better control
  const locationTimeoutRef = useRef(null);
  const dataTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // State for ranking modal
  const [isRankingModalVisible, setIsRankingModalVisible] = useState(false);

  // **MODIFIED: Extended timeout to 2 minutes (120 seconds)**
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const DEFAULT_REGION = {
      latitude: 18.7883,
      longitude: 98.9853,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };

    const initializeMap = async () => {
      try {
        if (!mounted) return;
        
        setLoadingMessage(t('airQuality.loadingMap'));
        setLoadingProgress(0.1);
        
        // **MODIFIED: Extended location timeout to 2 minutes (120 seconds)**
        locationTimeoutRef.current = setTimeout(() => {
          if (mounted && !region) {
            console.log('Location timeout after 2 minutes - using default region');
            setRegion(DEFAULT_REGION);
            setLoadingProgress(0.4);
            setLoadingMessage(t('airQuality.loadingData'));
          }
        }, 120000); // Changed from 5000 to 120000 (2 minutes)

        // **MODIFIED: Slower progressive loading updates for 2-minute duration**
        const progressInterval = setInterval(() => {
          if (mounted) {
            setLoadingProgress(prev => {
              // Slower progress increment to stretch over 2 minutes
              const newProgress = Math.min(prev + 0.01, 0.35); // Reduced from 0.05 to 0.01
              return newProgress;
            });
          }
        }, 1000); // Changed from 200ms to 1000ms (1 second intervals)

        // Handle location
        if (location && location.latitude && location.longitude) {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
          }
          clearInterval(progressInterval);
          
          const initialRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          };

          if (mounted) {
            setRegion(initialRegion);
            setLoadingProgress(0.4);
            setLoadingMessage(t('airQuality.loadingData'));
          }
        } else if (locationError || (!locationLoading && !location)) {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
          }
          clearInterval(progressInterval);
          
          if (mounted) {
            console.log('Using default location due to error or no location');
            setRegion(DEFAULT_REGION);
            setLoadingProgress(0.4);
            setLoadingMessage(t('airQuality.loadingData'));
          }
        }

        // Cleanup function
        return () => {
          clearInterval(progressInterval);
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
          }
        };

      } catch (error) {
        console.error('Error initializing map:', error);
        if (mounted) {
          setRegion(DEFAULT_REGION);
          setLoadingProgress(0.4);
          setLoadingMessage(t('airQuality.loadingData'));
        }
      }
    };

    const cleanup = initializeMap();

    return () => {
      mounted = false;
      mountedRef.current = false;
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [location, locationLoading, locationError, t]);

  // **MODIFIED: Extended data fetching timeout to 2 minutes**
  useEffect(() => {
    if (region && !dataFetchedRef.current && !isLoadingRef.current && mountedRef.current) {
      dataFetchedRef.current = true;
      
      // **MODIFIED: Extended data fetch timeout to 2 minutes (120 seconds)**
      dataTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && isLoadingRef.current) {
          console.log('Data fetch timeout after 2 minutes - proceeding with empty data');
          setIsDataLoading(false);
          isLoadingRef.current = false;
          setLoadingProgress(1);
          
          setTimeout(() => {
            if (mountedRef.current) {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }).start(() => {
                if (mountedRef.current) {
                  setIsLoading(false);
                }
              });
            }
          }, 500);
        }
      }, 120000); // Changed from 15000 to 120000 (2 minutes)
      
      fetchAQIData();
    }
  }, [region]);

  // Detect apiSource changes
  useEffect(() => {
    apiSourceRef.current = apiSource;
    if (dataFetchedRef.current && mountedRef.current) {
      setAqiPoints([]);
      setTimeout(() => {
        if (mountedRef.current) {
          fetchAQIData();
        }
      }, 100);
    }
  }, [apiSource]);

  const getApiSourceName = () => {
    try {
      return DataProviderFactory.getProviderName(apiSource);
    } catch (error) {
      console.error('Error getting API source name:', error);
      return t('airQuality.unknownSource');
    }
  };

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
        t('common.errorLoadingData', { error: error.message || 'Unknown reason' }),
        [{ text: t('common.ok'), style: 'default' }]
      );
      setIsDataLoading(false);
    }
  }, [apiSource, isLoadingRef.current, availableApiSources, t]);

  // Function to open ranking modal
  const handleOpenRanking = useCallback(() => {
    if (aqiPoints.length === 0 && !isDataLoading) {
      Alert.alert(
        t('airQuality.noData'),
        t('airQuality.noDataAvailable', { source: getApiSourceName() }),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }
    setIsRankingModalVisible(true);
  }, [aqiPoints.length, isDataLoading, getApiSourceName, t]);

  // **MODIFIED: Extended fetchAQIData timeout to 2 minutes**
  const fetchAQIData = async () => {
    if (isLoadingRef.current || !mountedRef.current) {
      console.log("fetchAQIData is already running or component unmounted. Skipping duplicate call.");
      return;
    }

    let timeoutId;
    let progressInterval;

    try {
      isLoadingRef.current = true;
      setIsDataLoading(true);
      setLoadingMessage(t('airQuality.loadingData'));
      setLoadingProgress(0.5);

      // Clear any existing data timeout
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }

      // **MODIFIED: Slower progressive loading for data fetch over 2 minutes**
      progressInterval = setInterval(() => {
        if (mountedRef.current) {
          setLoadingProgress(prev => {
            // Slower progress increment to stretch over 2 minutes
            const newProgress = Math.min(prev + 0.01, 0.9); // Reduced from 0.05 to 0.01
            return newProgress;
          });
        }
      }, 2000); // Changed from 300ms to 2000ms (2 second intervals)

      const currentApiSource = apiSourceRef.current;
      const dataProvider = DataProviderFactory.getProvider(currentApiSource);
      
      if (!dataProvider || typeof dataProvider.fetchData !== 'function') {
        throw new Error(t('airQuality.invalidDataProvider', { source: currentApiSource }));
      }

      // **MODIFIED: Extended Promise.race timeout to 2 minutes**
      const fetchPromise = dataProvider.fetchData();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data fetch timeout')), 120000); // Changed from 10000 to 120000
      });

      const formattedData = await Promise.race([fetchPromise, timeoutPromise]);

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (!mountedRef.current) return;

      setLoadingProgress(0.9);

      // Check if the user changed API source during loading
      if (currentApiSource !== apiSourceRef.current) {
        console.log(`apiSource changed during loading: ${currentApiSource} -> ${apiSourceRef.current}`);
        return;
      }

      // Check if there is enough data to display
      if (!formattedData || formattedData.length === 0) {
        console.warn(`No data found for API: ${currentApiSource}`);
        if (mountedRef.current) {
          Alert.alert(
            t('airQuality.noData'),
            t('airQuality.noDataAvailable', { source: getApiSourceName() }),
            [{ text: t('common.ok'), style: 'default' }]
          );
          if (aqiPoints.length === 0) {
            setAqiPoints([]);
          }
        }
      } else {
        if (mountedRef.current) {
          setAqiPoints(formattedData);
          console.log(`Data loaded successfully: ${formattedData.length} points`);
        }
      }

      if (mountedRef.current) {
        setLoadingProgress(1);
      }

      // Set timeout to hide loading screen
      timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            if (mountedRef.current) {
              setIsLoading(false);
            }
          });
        }
      }, 500);

    } catch (error) {
      console.error('Error fetching AQI data:', error);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (mountedRef.current) {
        setLoadingMessage(t('airQuality.errorLoadingData', { error: error.message || 'Unknown reason' }));

        Alert.alert(
          t('airQuality.error'),
          t('airQuality.errorLoadingData', { error: error.message || 'Unknown reason' }),
          [{ text: t('common.ok'), style: 'default' }]
        );

        if (aqiPoints.length === 0) {
          setAqiPoints([]);
        }

        setLoadingProgress(1);

        timeoutId = setTimeout(() => {
          if (mountedRef.current) {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              if (mountedRef.current) {
                setIsLoading(false);
              }
            });
          }
        }, 1000);
      }
    } finally {
      if (mountedRef.current) {
        setIsDataLoading(false);
      }
      isLoadingRef.current = false;
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }

    // Return cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  };

  // Function to handle region change
  const handleRegionChange = useCallback((newRegion) => {
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }

    regionChangeTimeoutRef.current = setTimeout(() => {
      if (region) {
        const latDiff = Math.abs(newRegion.latitude - region.latitude);
        const lngDiff = Math.abs(newRegion.longitude - region.longitude);
        const deltaLatDiff = Math.abs(newRegion.latitudeDelta - region.latitudeDelta);

        if (latDiff > 0.01 || lngDiff > 0.01 || deltaLatDiff > 0.01) {
          setRegion(newRegion);
        }
      } else {
        setRegion(newRegion);
      }

      regionChangeTimeoutRef.current = null;
    }, 300);
  }, [region]);

  // Function to handle marker press
  const handleMarkerPress = useCallback((marker) => {
    if (marker && marker.id) {
      InteractionManager.runAfterInteractions(() => {
        setSelectedMarker(marker);
        setIsModalVisible(true);
      });
    }
  }, []);

  // **MODIFIED: Updated skip function message for 2-minute wait**
  const skipLocationLoading = useCallback(() => {
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    const defaultRegion = {
      latitude: 18.7883,
      longitude: 98.9853,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
    
    setRegion(defaultRegion);
    setLoadingProgress(0.4);
    setLoadingMessage(t('airQuality.loadingData'));
    
    // Force immediate data fetch
    setTimeout(() => {
      if (mountedRef.current && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        fetchAQIData();
      }
    }, 100);
  }, [t]);

  // Function to go to current location
  const goToCurrentLocation = useCallback(async () => {
    try {
      setIsDataLoading(true);

      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
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
    } catch (error) {
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
  if (isLoading || !region) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <BeautifulLoadingScreen
          progress={loadingProgress}
          message={loadingMessage}
        />
        {/* **MODIFIED: Show skip button throughout 2-minute loading period** */}
        {loadingProgress <= 0.9 && (
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
        initialRegion={region}
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

      {selectedMarker && (
        <AQIModal
          visible={isModalVisible}
          marker={selectedMarker}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedMarker(null);
          }}
          position="top"
        />
      )}

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