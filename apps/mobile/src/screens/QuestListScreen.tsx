import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

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
  distance_miles?: number;
}

interface QuestListScreenProps {
  onQuestSelect: (questId: string) => void;
  userLocation?: { lat: number; lng: number };
}

export const QuestListScreen: React.FC<QuestListScreenProps> = ({
  onQuestSelect,
  userLocation,
}) => {
  const { callRpc, isConnected } = useNakama();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuests();
  }, [userLocation]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const payload = userLocation
        ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            maxDistanceKm: 10,
          }
        : undefined;

      const result = await callRpc('get_available_quests', payload);

      if (result.success && result.quests) {
        setQuests(result.quests);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuests();
  };

  const renderQuestItem = ({ item }: { item: Quest }) => {
    const isActive = item.user_status === 'active';
    const isCompleted = item.user_status === 'completed';

    return (
      <TouchableOpacity
        style={styles.questCard}
        onPress={() => onQuestSelect(item.id)}
        activeOpacity={0.7}
      >
        {/* Quest Image Placeholder */}
        <View style={styles.questImageContainer}>
          <View style={styles.questImagePlaceholder}>
            <Text style={styles.questImageIcon}>📍</Text>
          </View>
        </View>

        {/* Quest Content */}
        <View style={styles.questContent}>
          <Text style={styles.questTitle}>{item.title}</Text>
          <Text style={styles.questDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Quest Metadata */}
          <View style={styles.questMetadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⏱️</Text>
              <Text style={styles.metadataText}>90 min</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⭐</Text>
              <Text style={styles.metadataText}>{item.xp_reward} XP</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>👥</Text>
              <Text style={styles.metadataText}>0/100</Text>
            </View>

            {item.distance_miles && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>📍</Text>
                <Text style={styles.metadataText}>
                  {item.distance_miles.toFixed(1)} mi
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          {isActive && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          )}

          {isCompleted && (
            <View style={[styles.statusBadge, styles.completedBadge]}>
              <Text style={styles.statusBadgeText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        <View style={styles.joinButtonContainer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              isActive && styles.activeButton,
              isCompleted && styles.completedButton,
            ]}
            onPress={() => onQuestSelect(item.id)}
            disabled={isCompleted}
          >
            <Text
              style={[
                styles.joinButtonText,
                isCompleted && styles.completedButtonText,
              ]}
            >
              {isCompleted ? 'Completed' : isActive ? 'Continue' : 'Join Quest'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quests}
        renderItem={renderQuestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No quests available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new adventures!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  questCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  questImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  questImageIcon: {
    fontSize: 48,
  },
  questContent: {
    padding: 16,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButtonContainer: {
    padding: 16,
    paddingTop: 0,
  },
  joinButton: {
    backgroundColor: '#17B26A',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF9500',
  },
  completedButton: {
    backgroundColor: '#e0e0e0',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});

