import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNakama } from '../contexts/NakamaContext';
import { PlaceDetailScreen } from './PlaceDetailScreen';
import { QuestDetailScreen } from './QuestDetailScreen';

interface ActivityHistoryScreenProps {
  onClose: () => void;
}

interface ActivityItem {
  id: string;
  type: 'place' | 'quest' | 'achievement';
  name: string;
  time: Date;
  icon: string;
  iconColor: string;
  xpReward?: number;
  placeId?: string;
  questId?: string;
  liked: boolean;
}

export const ActivityHistoryScreen: React.FC<ActivityHistoryScreenProps> = ({
  onClose,
}) => {
  const { callRpc } = useNakama();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'place' | 'quest' | 'achievement'>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Fetch user quests for quest activities
      const questsResult = await callRpc('get_user_quests', {});
      
      // Combine different activity sources
      const allActivities: ActivityItem[] = [];
      
      if (questsResult.success && questsResult.quests) {
        questsResult.quests.forEach((quest: any) => {
          allActivities.push({
            id: quest.user_quest_id || quest.quest_id,
            type: 'quest',
            name: quest.title,
            time: new Date(quest.completed_at || quest.started_at),
            icon: quest.status === 'completed' ? 'trophy' : 'star',
            iconColor: quest.status === 'completed' ? '#17B2B2' : '#FF9500',
            xpReward: quest.xp_reward,
            questId: quest.quest_id,
            liked: false,
          });
        });
      }

      // Sort by time (most recent first)
      allActivities.sort((a, b) => b.time.getTime() - a.time.getTime());

      // Apply filter
      let filtered = allActivities;
      if (filter !== 'all') {
        filtered = allActivities.filter((a) => a.type === filter);
      }

      setActivities(filtered);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const formatActivityTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (diffMins < 60) {
      return `Just now • ${timeStr}`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago • ${timeStr}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${timeStr}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago • ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleLike = async (activityId: string) => {
    // Update local state immediately
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, liked: !a.liked } : a))
    );
    // TODO: Call API to persist like status
  };

  const handleActivityPress = (activity: ActivityItem) => {
    if (activity.type === 'place' && activity.placeId) {
      setSelectedPlace({ id: activity.placeId, name: activity.name });
    } else if (activity.type === 'quest' && activity.questId) {
      setSelectedQuestId(activity.questId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity History</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'place', 'quest', 'achievement'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterTab, filter === filterType && styles.filterTabActive]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterType && styles.filterTabTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17B2B2" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No activities found</Text>
          <Text style={styles.emptySubtext}>
            Your activities will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleActivityPress(activity)}
            >
              <View
                style={[styles.activityIcon, { backgroundColor: activity.iconColor }]}
              >
                <Ionicons name={activity.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.activityInfo}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  {activity.xpReward && (
                    <View style={styles.xpBadge}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.xpText}>+{activity.xpReward} XP</Text>
                    </View>
                  )}
                </View>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityType}>
                    {activity.type === 'place'
                      ? 'Place visited'
                      : activity.type === 'quest'
                      ? 'Quest completed'
                      : 'Achievement unlocked'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatActivityTime(activity.time)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleLike(activity.id)}>
                <Ionicons
                  name={activity.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={activity.liked ? '#FF69B4' : '#999'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailScreen
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}

      {/* Quest Detail Modal */}
      {selectedQuestId && (
        <QuestDetailScreen
          questId={selectedQuestId}
          onClose={() => setSelectedQuestId(null)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#17B2B2',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityType: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
});

