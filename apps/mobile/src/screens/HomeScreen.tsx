import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';
import { MapComponent } from '../components/MapComponent';
import { QuestDetailScreen } from './QuestDetailScreen';
import { QuestListScreen } from './QuestListScreen';

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
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showQuestList, setShowQuestList] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    
    // Call Nakama RPC to update user location
    try {
      const result = await callRpc('update_user_location', {
        latitude,
        longitude
      });
    } catch (error) {
      console.error('Error calling update_user_location RPC:', error);
    }
  };

  const handleQuestSelect = (questId: string) => {
    setSelectedQuestId(questId);
  };

  const handleQuestAction = () => {
    // Refresh quest list when quest is started/completed
    setRefreshTrigger(prev => prev + 1);
    setSelectedQuestId(null);
  };

  const handleCloseQuestDetail = () => {
    setSelectedQuestId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {username}!</Text>
        <Text style={styles.subtitle}>Explore the world around you</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapComponent 
          onLocationUpdate={handleLocationUpdate}
          onQuestSelect={handleQuestSelect}
        />
      </View>

      {/* Quest List Button */}
      <TouchableOpacity
        style={styles.questListButton}
        onPress={() => setShowQuestList(true)}
      >
        <Text style={styles.questListButtonText}>📋 View Quests</Text>
      </TouchableOpacity>

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

      {/* Quest Detail Modal */}
      {selectedQuestId && (
        <Modal
          visible={!!selectedQuestId}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseQuestDetail}
        >
          <QuestDetailScreen
            questId={selectedQuestId}
            onClose={handleCloseQuestDetail}
            onQuestStarted={handleQuestAction}
          />
        </Modal>
      )}

      {/* Quest List Modal */}
      <Modal
        visible={showQuestList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuestList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQuestList(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quests</Text>
          </View>
          <QuestListScreen
            onQuestSelect={(questId) => {
              setShowQuestList(false);
              setSelectedQuestId(questId);
            }}
            userLocation={currentLocation || undefined}
          />
        </View>
      </Modal>
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
  questListButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  questListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
