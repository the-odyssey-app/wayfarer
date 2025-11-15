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
import { QuestDetailScreen } from './QuestDetailScreen';

interface CalendarScreenProps {
  onClose: () => void;
}

interface ScheduledQuest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time?: string;
  latitude?: number;
  longitude?: number;
  xp_reward: number;
  difficulty: number;
  status: string;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ onClose }) => {
  const { callRpc } = useNakama();
  const [quests, setQuests] = useState<ScheduledQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadScheduledQuests();
  }, [selectedDate]);

  const loadScheduledQuests = async () => {
    try {
      setLoading(true);
      // Use get_available_quests and filter by start_time
      const result = await callRpc('get_available_quests', {});

      if (result.success && result.quests) {
        // Filter for quests with start_time in the future
        const now = new Date();
        const scheduled = result.quests.filter((quest: any) => {
          if (!quest.start_time) return false;
          const startTime = new Date(quest.start_time);
          return startTime >= now;
        });

        // Sort by start time
        scheduled.sort((a: any, b: any) => {
          const aTime = new Date(a.start_time).getTime();
          const bTime = new Date(b.start_time).getTime();
          return aTime - bTime;
        });

        setQuests(scheduled);
      }
    } catch (error) {
      console.error('Error loading scheduled quests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadScheduledQuests();
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const questDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let dateStr = '';
    if (questDate.getTime() === today.getTime()) {
      dateStr = 'Today';
    } else if (questDate.getTime() === today.getTime() + 86400000) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
  };

  const getTimeUntilStart = (startTime: string): string => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins > 0 ? `${diffMins} min${diffMins > 1 ? 's' : ''}` : 'Starting now';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Quests</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17B2B2" />
          <Text style={styles.loadingText}>Loading scheduled quests...</Text>
        </View>
      ) : quests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No scheduled quests</Text>
          <Text style={styles.emptySubtext}>
            Quests with start times will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {quests.map((quest) => (
            <TouchableOpacity
              key={quest.id}
              style={styles.questCard}
              onPress={() => setSelectedQuestId(quest.id)}
            >
              <View style={styles.questHeader}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>
                    {getTimeUntilStart(quest.start_time)}
                  </Text>
                </View>
              </View>
              {quest.description && (
                <Text style={styles.questDescription} numberOfLines={2}>
                  {quest.description}
                </Text>
              )}
              <View style={styles.questMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color="#17B2B2" />
                  <Text style={styles.metaText}>
                    {formatDateTime(quest.start_time)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.metaText}>+{quest.xp_reward} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  questCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timeBadge: {
    backgroundColor: '#17B2B2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
});

