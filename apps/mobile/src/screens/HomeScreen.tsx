import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';
import { MapComponent } from '../components/MapComponent';

interface HomeScreenProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userId,
  username,
  onLogout,
}) => {
  const { session, isConnected, disconnect, callRpc } = useNakama();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleLogout = async () => {
    try {
      await disconnect();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLocationUpdate = async (latitude: number, longitude: number) => {
    setCurrentLocation({ lat: latitude, lng: longitude });
    console.log('Location updated:', latitude, longitude);
    
    // Call Nakama RPC to update user location
    try {
      const result = await callRpc('update_user_location', {
        latitude,
        longitude
      });
      
      if (result.success) {
        console.log('Location updated successfully on server');
      } else {
        console.error('Failed to update location on server:', result.error);
      }
    } catch (error) {
      console.error('Error calling update_user_location RPC:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {username}!</Text>
        <Text style={styles.subtitle}>Explore the world around you</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapComponent onLocationUpdate={handleLocationUpdate} />
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>
          Nakama: {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
        {currentLocation && (
          <Text style={styles.statusText}>
            Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    margin: 10,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    marginBottom: 2,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 10,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
