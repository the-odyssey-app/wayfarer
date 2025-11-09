import React, { useState, useEffect } from 'react';
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
import { LeaderboardScreen } from './LeaderboardScreen';
import { InventoryScreen } from './InventoryScreen';
import { PlacesScreen } from './PlacesScreen';
import { AchievementsScreen } from './AchievementsScreen';

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [eventQuests, setEventQuests] = useState<any[]>([]);
  const [showEventQuests, setShowEventQuests] = useState(false);
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

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    try {
      const result = await callRpc('get_active_event', {});
      if (result.success && result.event) {
        setActiveEvent(result.event);
        setEventQuests(result.quests || []);
      } else {
        setActiveEvent(null);
        setEventQuests([]);
      }
    } catch (error) {
      console.error('Error loading active event:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {username}!</Text>
        <Text style={styles.subtitle}>Explore the world around you</Text>
        
        {/* Event Banner */}
        {activeEvent && (
          <TouchableOpacity style={styles.eventBanner} onPress={() => setShowEventQuests(true)}>
            <Text style={styles.eventBannerTitle}>🎉 {activeEvent.title}</Text>
            <Text style={styles.eventBannerText}>{activeEvent.description}</Text>
            <Text style={styles.eventBannerSubtext}>
              {new Date(activeEvent.end_date).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapComponent 
          onLocationUpdate={handleLocationUpdate}
          onQuestSelect={handleQuestSelect}
        />
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowQuestList(true)}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>Quests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowLeaderboard(true)}
        >
          <Text style={styles.quickActionIcon}>🏆</Text>
          <Text style={styles.quickActionText}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowInventory(true)}
        >
          <Text style={styles.quickActionIcon}>🎒</Text>
          <Text style={styles.quickActionText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowPlaces(true)}
        >
          <Text style={styles.quickActionIcon}>📍</Text>
          <Text style={styles.quickActionText}>Places</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowAchievements(true)}
        >
          <Text style={styles.quickActionIcon}>🏆</Text>
          <Text style={styles.quickActionText}>Achievements</Text>
        </TouchableOpacity>
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

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      </Modal>

      {/* Inventory Modal */}
      <Modal
        visible={showInventory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInventory(false)}
      >
        <InventoryScreen onClose={() => setShowInventory(false)} />
      </Modal>

      {/* Places Modal */}
      <Modal
        visible={showPlaces}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlaces(false)}
      >
        <PlacesScreen onClose={() => setShowPlaces(false)} userLocation={currentLocation || undefined} />
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievements}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAchievements(false)}
      >
        <AchievementsScreen onClose={() => setShowAchievements(false)} />
      </Modal>

      {/* Active Event Quests Modal */}
      <Modal
        visible={showEventQuests}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventQuests(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEventQuests(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{activeEvent?.title || 'Event Quests'}</Text>
          </View>
          <View style={{ padding: 20 }}>
            {eventQuests.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={{ padding: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 12 }}
                onPress={() => {
                  setShowEventQuests(false);
                  setSelectedQuestId(q.id);
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 }}>{q.title}</Text>
                <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={2}>{q.description}</Text>
              </TouchableOpacity>
            ))}
            {eventQuests.length === 0 && (
              <Text style={{ fontSize: 14, color: '#666' }}>No quests available for this event.</Text>
            )}
          </View>
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
    marginBottom: 12,
  },
  eventBanner: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  eventBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventBannerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  eventBannerSubtext: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
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
  quickActionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    color: '#333',
    fontSize: 12,
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
