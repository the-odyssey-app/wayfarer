import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface PlacesScreenProps {
  onClose?: () => void;
  userLocation?: { lat: number; lng: number };
}

interface Place {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
  distance_km?: number;
}

export const PlacesScreen: React.FC<PlacesScreenProps> = ({ onClose, userLocation }) => {
  const { callRpc } = useNakama();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        const payload = userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng, maxDistanceKm: 15 } : undefined;
        const res = await callRpc('get_places_nearby', payload || {});
        if (res?.success) {
          setPlaces(res.places || []);
        } else {
          setPlaces([]);
        }
      } catch (e) {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlaces();
  }, [userLocation]);

  const renderItem = ({ item }: { item: Place }) => (
    <View style={styles.placeCard}>
      <View style={styles.placeHeader}>
        <Text style={styles.placeName}>{item.name}</Text>
        {item.distance_km !== undefined && (
          <Text style={styles.placeDistance}>{item.distance_km.toFixed(1)} km</Text>
        )}
      </View>
      {item.description ? (
        <Text style={styles.placeDescription} numberOfLines={2}>{item.description}</Text>
      ) : null}
      {item.category ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Places Nearby</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No places found nearby.</Text>}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  placeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeDistance: {
    fontSize: 12,
    color: '#666',
  },
  placeDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
});


