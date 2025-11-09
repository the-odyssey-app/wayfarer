import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';

interface QuestCompleteScreenProps {
  questId: string;
  questTitle: string;
  rewards: {
    xp: number;
    coins?: number;
    items?: string[];
    badges?: string[];
    levelUp?: boolean;
    newLevel?: number | null;
    rankUp?: boolean;
    newRank?: number | null;
  };
  stats?: {
    timeTaken?: number; // in minutes
    completionTime?: string;
    efficiency?: number;
  };
  onContinue: () => void;
  onShare?: () => void;
  onNextQuest?: () => void;
}

export const QuestCompleteScreen: React.FC<QuestCompleteScreenProps> = ({
  questId,
  questTitle,
  rewards,
  stats,
  onContinue,
  onShare,
  onNextQuest,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [showRewards, setShowRewards] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Animate celebration
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Show rewards after a delay
    setTimeout(() => setShowRewards(true), 600);
    setTimeout(() => setShowStats(true), 1200);
  }, []);

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Animation */}
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Quest Complete!</Text>
          <Text style={styles.questTitle}>{questTitle}</Text>
        </Animated.View>

        {/* Rewards Section */}
        {showRewards && (
          <Animated.View
            style={[styles.rewardsContainer, { opacity: opacityAnim }]}
          >
            <Text style={styles.sectionTitle}>Rewards Earned</Text>
            
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>⭐</Text>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardLabel}>Experience Points</Text>
                <Text style={styles.rewardValue}>+{rewards.xp} XP</Text>
              </View>
            </View>

            {rewards.coins && rewards.coins > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🪙</Text>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Coins</Text>
                  <Text style={styles.rewardValue}>+{rewards.coins}</Text>
                </View>
              </View>
            )}

            {rewards.items && rewards.items.length > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🎁</Text>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Items</Text>
                  <Text style={styles.rewardValue}>
                    {rewards.items.length} item{rewards.items.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}

            {rewards.levelUp && rewards.newLevel && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⬆️</Text>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Level Up</Text>
                  <Text style={styles.rewardValue}>Level {rewards.newLevel}</Text>
                </View>
              </View>
            )}

            {rewards.rankUp && rewards.newRank && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🏅</Text>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Rank</Text>
                  <Text style={styles.rewardValue}>
                    {rewards.newRank === 5 ? 'Renowned Trailblazer' :
                     rewards.newRank === 4 ? 'Expert Explorer' :
                     rewards.newRank === 3 ? 'Adept Cartographer' :
                     rewards.newRank === 2 ? 'Junior Wayfarer' : 'New Wayfarer'}
                  </Text>
                </View>
              </View>
            )}

            {rewards.badges && rewards.badges.length > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🏆</Text>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Badges Unlocked</Text>
                  <Text style={styles.rewardValue}>
                    {rewards.badges.length} badge{rewards.badges.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Stats Section */}
        {showStats && stats && (
          <Animated.View
            style={[styles.statsContainer, { opacity: opacityAnim }]}
          >
            <Text style={styles.sectionTitle}>Quest Statistics</Text>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Time Taken</Text>
              <Text style={styles.statValue}>
                {formatTime(stats.timeTaken)}
              </Text>
            </View>

            {stats.completionTime && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Completed At</Text>
                <Text style={styles.statValue}>{stats.completionTime}</Text>
              </View>
            )}

            {stats.efficiency !== undefined && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Efficiency</Text>
                <View style={styles.efficiencyContainer}>
                  <View style={styles.efficiencyBar}>
                    <View
                      style={[
                        styles.efficiencyFill,
                        { width: `${stats.efficiency}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.efficiencyText}>{stats.efficiency}%</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Share Section */}
        {onShare && (
          <View style={styles.shareContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Text style={styles.shareButtonText}>📤 Share Achievement</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onNextQuest && (
          <TouchableOpacity
            style={[styles.actionButton, styles.nextQuestButton]}
            onPress={onNextQuest}
          >
            <Text style={styles.actionButtonText}>Find Next Quest</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.continueButton]}
          onPress={onContinue}
        >
          <Text style={styles.actionButtonText}>Continue Exploring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  celebrationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#17B26A',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
  rewardsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  rewardContent: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  efficiencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  efficiencyBar: {
    width: 100,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  efficiencyFill: {
    height: '100%',
    backgroundColor: '#17B26A',
    borderRadius: 4,
  },
  efficiencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  shareContainer: {
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextQuestButton: {
    backgroundColor: '#17B26A',
  },
  continueButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

