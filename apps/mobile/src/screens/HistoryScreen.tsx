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

interface HistoryScreenProps {
  onClose: () => void;
}

interface QuestHistoryItem {
  user_quest_id: string;
  quest_id: string;
  title: string;
  description: string;
  status: string;
  xp_reward: number;
  difficulty: number;
  started_at: string;
  completed_at: string | null;
  latitude?: number;
  longitude?: number;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onClose }) => {
  const { callRpc } = useNakama();
  const [quests, setQuests] = useState<QuestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'abandoned'>('all');

  useEffect(() => {
    loadQuests();
  }, [filter]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const result = await callRpc('get_user_quests', {});

      if (result.success && result.quests) {
        let filtered = result.quests;
        
        if (filter === 'completed') {
          filtered = filtered.filter((q: QuestHistoryItem) => q.status === 'completed');
        } else if (filter === 'active') {
          filtered = filtered.filter((q: QuestHistoryItem) => q.status === 'active');
        } else if (filter === 'abandoned') {
          filtered = filtered.filter((q: QuestHistoryItem) => q.status === 'abandoned');
        }

        setQuests(filtered);
      }
    } catch (error) {
      console.error('Error loading quest history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuests();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'active':
        return '#17B2B2';
      case 'abandoned':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'Active';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quest History</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'completed', 'active', 'abandoned'] as const).map((filterType) => (
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
          <Text style={styles.loadingText}>Loading quest history...</Text>
        </View>
      ) : quests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No quests found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all'
              ? 'You haven\'t started any quests yet'
              : `No ${filter} quests`}
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
              key={quest.user_quest_id}
              style={styles.questCard}
              onPress={() => setSelectedQuestId(quest.quest_id)}
            >
              <View style={styles.questHeader}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(quest.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(quest.status)}
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
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.metaText}>+{quest.xp_reward} XP</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.metaText}>
                    {quest.completed_at
                      ? `Completed ${formatDate(quest.completed_at)}`
                      : `Started ${formatDate(quest.started_at)}`}
                  </Text>
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
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

