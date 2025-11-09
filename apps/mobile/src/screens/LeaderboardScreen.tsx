import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  score: number;
  rank: number;
  level?: number;
  avatar_url?: string;
}

interface LeaderboardScreenProps {
  onClose?: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onClose }) => {
  const { callRpc, isConnected } = useNakama();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metricType, setMetricType] = useState<'total_xp' | 'quests_completed'>('total_xp');
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [metricType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const result = await callRpc('get_leaderboard', {
        period: 'weekly',
        metricType: metricType,
        limit: 100,
      });

      if (result.success) {
        setLeaderboard(result.leaderboard || []);
        setUserRank(result.userRank || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.leaderboardItem, index < 3 && styles.topThreeItem]}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankIcon}>{renderRankIcon(item.rank)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
        {item.level && (
          <Text style={styles.levelText}>Level {item.level}</Text>
        )}
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          {metricType === 'total_xp' ? `${item.score} XP` : `${item.score} quests`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>Leaderboard</Text>

      {/* Metric Type Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selectorButton, metricType === 'total_xp' && styles.selectorButtonActive]}
          onPress={() => setMetricType('total_xp')}
        >
          <Text style={[styles.selectorText, metricType === 'total_xp' && styles.selectorTextActive]}>
            XP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectorButton, metricType === 'quests_completed' && styles.selectorButtonActive]}
          onPress={() => setMetricType('quests_completed')}
        >
          <Text style={[styles.selectorText, metricType === 'quests_completed' && styles.selectorTextActive]}>
            Quests
          </Text>
        </TouchableOpacity>
      </View>

      {userRank && (
        <View style={styles.userRankContainer}>
          <Text style={styles.userRankText}>Your Rank: #{userRank}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.user_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leaderboard data yet</Text>
            </View>
          }
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
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectorButtonActive: {
    backgroundColor: '#007AFF',
  },
  selectorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#fff',
  },
  userRankContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  userRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  topThreeItem: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

