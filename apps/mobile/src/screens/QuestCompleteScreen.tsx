import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuestCompleteScreenProps {
  quest: {
    title: string;
    xpEarned?: number;
    bonusPoints?: number;
  };
  onShare?: () => void;
  onContinue?: () => void;
}

export const QuestCompleteScreen: React.FC<QuestCompleteScreenProps> = ({
  quest,
  onShare,
  onContinue,
}) => {
  return (
    <View style={styles.container}>
      {/* Trophy Icon */}
      <View style={styles.trophyContainer}>
        <View style={styles.trophyCircle}>
          <Ionicons name="trophy" size={64} color="#FFD700" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Quest Complete!</Text>

      {/* Message */}
      <Text style={styles.message}>
        You've successfully finished the {quest.title}
      </Text>

      {/* Rewards Section */}
      <View style={styles.rewardsContainer}>
        <View style={styles.rewardItem}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.rewardLabel}>XP Earned</Text>
          <Text style={styles.rewardValue}>+{quest.xpEarned || 100} XP</Text>
        </View>

        {quest.bonusPoints && quest.bonusPoints > 0 && (
          <View style={styles.rewardItem}>
            <Ionicons name="diamond" size={24} color="#FF69B4" />
            <Text style={styles.rewardLabel}>Bonus Points</Text>
            <Text style={styles.rewardValue}>+{quest.bonusPoints}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Achievement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue Exploring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  trophyContainer: {
    marginBottom: 24,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  rewardsContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rewardLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#17B2B2',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
