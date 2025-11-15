import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useNakama } from '../contexts/NakamaContext';

// Configure Mapbox
const mapboxToken = Constants.expoConfig?.extra?.mapboxAccessToken || 
                    Constants.expoConfig?.mapboxAccessToken ||
                    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  console.error('Mapbox token not configured. Set mapboxAccessToken in app.json extra section or EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.');
  // Note: Mapbox will fail to initialize without a token, but we don't want to crash the app
  // This allows the app to start but map features will not work
}
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

interface Quest {
  id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  difficulty: number;
  xp_reward: number;
  user_status: string;
}

interface MapComponentProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  onQuestSelect?: (quest: Quest) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  selectedQuestId?: string | null;
  routeCoordinates?: [number, number][];
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  onLocationUpdate, 
  onQuestSelect, 
  zoomLevel = 15,
  selectedQuestId = null,
  routeCoordinates = [],
}) => {
  const { callRpc, isConnected } = useNakama();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const cameraRef = React.useRef<Mapbox.Camera>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (isConnected && location) {
      fetchQuests();
    }
  }, [isConnected, location]);

  useEffect(() => {
    if (cameraRef.current && location) {
      cameraRef.current.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: zoomLevel,
        animationDuration: 500,
      });
    }
  }, [zoomLevel, location]);

  const getCurrentLocation = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate(currentLocation.coords.latitude, currentLocation.coords.longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get current location');
    }
  };

  const fetchQuests = async () => {
    try {
      setLoadingQuests(true);
      
      // Only fetch quests if we have a valid session
      if (!isConnected) {
        return;
      }
      
      // Pass location data if available for location-based filtering
      const payload = location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            maxDistanceKm: 10,
          }
        : undefined;
      
      const result = await callRpc('get_available_quests', payload);
      
      if (result.success) {
        setQuests(result.quests || []);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoadingQuests(false);
    }
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Latitude must be between -90 and 90, longitude between -180 and 180');
      return;
    }

    // Create a mock location object
    const mockLocation: Location.LocationObject = {
      coords: {
        latitude: lat,
        longitude: lng,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    setLocation(mockLocation);
    setShowManualInput(false);
    
    // Notify parent component
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.manualButton} 
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
        <TouchableOpacity 
          style={styles.manualButton} 
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={[location.coords.longitude, location.coords.latitude]}
          zoomLevel={zoomLevel}
          animationMode="flyTo"
          animationDuration={500}
        />
        
        {/* User location marker */}
        <Mapbox.PointAnnotation
          id="user-location"
          coordinate={[location.coords.longitude, location.coords.latitude]}
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Mapbox.PointAnnotation>

        {/* Quest markers */}
        {quests.map((quest) => {
          const isSelected = selectedQuestId === quest.id;
          const isActive = quest.user_status === 'active';
          
          return (
            <Mapbox.PointAnnotation
              key={quest.id}
              id={`quest-${quest.id}`}
              coordinate={[quest.location_lng, quest.location_lat]}
              onSelected={() => {
                if (onQuestSelect) {
                  onQuestSelect(quest);
                }
              }}
            >
              <TouchableOpacity
                style={[
                  styles.questMarker,
                  isSelected 
                    ? styles.selectedQuestMarker 
                    : isActive 
                    ? styles.activeQuestMarker 
                    : styles.availableQuestMarker
                ]}
                onPress={() => {
                  if (onQuestSelect) {
                    onQuestSelect(quest);
                  }
                }}
              >
                <Ionicons 
                  name="location" 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </Mapbox.PointAnnotation>
          );
        })}

        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Mapbox.ShapeSource
            id="route"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
            }}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: '#17B2B2',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      {/* Location info overlay */}
      <View style={styles.locationInfo}>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {location.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.questCountText}>
            Quests: {quests.length} {loadingQuests ? '(loading...)' : ''}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={getCurrentLocation}
          >
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.manualButton} 
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualButtonText}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual location input modal */}
      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Location Manually</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Latitude (e.g., 37.7749)"
              value={manualLat}
              onChangeText={setManualLat}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Longitude (e.g., -122.4194)"
              value={manualLng}
              onChangeText={setManualLng}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleManualLocationSubmit}
              >
                <Text style={styles.submitButtonText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  questCountText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF69B4',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  questMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  availableQuestMarker: {
    backgroundColor: '#17B2B2',
  },
  activeQuestMarker: {
    backgroundColor: '#FF9500',
  },
  selectedQuestMarker: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.2 }],
  },
});
