import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface AchievementsScreenProps {
  onClose?: () => void;
}

interface UserBadge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity?: string;
  earned_at: string;
}

interface UserAchievement {
  id: string;
  quest_id?: string;
  quest_title?: string;
  achievement_type: string;
  description?: string;
  created_at: string;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ onClose }) => {
  const { callRpc } = useNakama();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ quests_completed: number; next_threshold: number | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await callRpc('get_user_achievements', {});
        if (res?.success) {
          setBadges(res.badges || []);
          setAchievements(res.achievements || []);
          setStats(res.stats || null);
        } else {
          setBadges([]);
          setAchievements([]);
          setStats(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progressToNext = () => {
    if (!stats) return 0;
    const thresholds = [1, 5, 10, 25, 50];
    const next = stats.next_threshold || thresholds[thresholds.length - 1];
    const prev = thresholds.reduce((acc, t) => (t < next ? t : acc), 0);
    const range = next - prev;
    const val = Math.max(0, Math.min(next, stats.quests_completed)) - prev;
    return Math.max(0, Math.min(1, range > 0 ? val / range : 1));
  };

  const renderBadge = ({ item }: { item: UserBadge }) => (
    <View style={styles.badgeCard}>
      <View style={[styles.rarityDot, { backgroundColor: rarityColor(item.rarity) }]} />
      <Text style={styles.badgeName}>{item.name}</Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.badgeMeta}>{new Date(item.earned_at).toLocaleDateString()}</Text>
    </View>
  );

  const renderAchievement = ({ item }: { item: UserAchievement }) => (
    <View style={styles.achCard}>
      <Text style={styles.achTitle}>{item.description || item.achievement_type}</Text>
      {item.quest_title ? (
        <Text style={styles.achSub}>{item.quest_title}</Text>
      ) : null}
      <Text style={styles.achMeta}>{new Date(item.created_at).toLocaleString()}</Text>
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
        <Text style={styles.title}>Achievements</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Progress Section */}
          {stats && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Quests Completed</Text>
                <Text style={styles.progressValue}>{stats.quests_completed}</Text>
              </View>
              {stats.next_threshold && (
                <Text style={styles.progressSub}>Next badge at {stats.next_threshold}</Text>
              )}
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progressToNext() * 100}%` }]} /></View>
            </View>
          )}

          {/* Badges Section */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <FlatList
            data={badges}
            horizontal
            keyExtractor={(b) => b.id}
            renderItem={renderBadge}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 12 }}
          />

          {/* Achievements Section */}
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <FlatList
            data={achievements}
            keyExtractor={(a) => a.id}
            renderItem={renderAchievement}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
          />
        </ScrollView>
      )}
    </View>
  );
};

function rarityColor(r?: string) {
  switch ((r || '').toLowerCase()) {
    case 'legendary': return '#FF6B00';
    case 'epic': return '#9B59B6';
    case 'rare': return '#3498DB';
    case 'uncommon': return '#2ECC71';
    default: return '#95A5A6';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  closeButtonText: { fontSize: 18, color: '#333', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8, marginHorizontal: 20 },
  badgeCard: { width: 180, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  rarityDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  badgeName: { fontSize: 14, fontWeight: '600', color: '#333' },
  badgeDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  badgeMeta: { fontSize: 10, color: '#999', marginTop: 8 },
  achCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  achTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  achSub: { fontSize: 12, color: '#666', marginTop: 2 },
  achMeta: { fontSize: 10, color: '#999', marginTop: 6 },
  progressCard: { backgroundColor: '#fff7ed', borderRadius: 12, padding: 16, margin: 20, borderWidth: 1, borderColor: '#fde68a' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  progressValue: { fontSize: 18, fontWeight: '700', color: '#92400e' },
  progressSub: { fontSize: 12, color: '#b45309', marginTop: 6 },
  progressBar: { height: 8, backgroundColor: '#fde68a', borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#f59e0b' },
});


