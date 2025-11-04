import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface QuestDetailScreenProps {
  questId: string;
  onClose: () => void;
  onQuestStarted?: () => void;
}

interface QuestDetails {
  id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  difficulty: number;
  xp_reward: number;
  user_status: string;
  progress?: number;
}

export const QuestDetailScreen: React.FC<QuestDetailScreenProps> = ({
  questId,
  onClose,
  onQuestStarted,
}) => {
  const { callRpc, isConnected } = useNakama();
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadQuestDetails();
  }, [questId]);

  const loadQuestDetails = async () => {
    try {
      setLoading(true);
      const result = await callRpc('get_available_quests');
      
      if (result.success && result.quests) {
        const foundQuest = result.quests.find((q: QuestDetails) => q.id === questId);
        if (foundQuest) {
          setQuest(foundQuest);
        }
      }
    } catch (error) {
      console.error('Error loading quest details:', error);
      Alert.alert('Error', 'Failed to load quest details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuest = async () => {
    if (!quest) return;

    try {
      setStarting(true);
      const result = await callRpc('start_quest', { quest_id: quest.id });

      if (result.success) {
        Alert.alert('Quest Started!', `You've started "${quest.title}"`);
        if (onQuestStarted) {
          onQuestStarted();
        }
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to start quest');
      }
    } catch (error) {
      console.error('Error starting quest:', error);
      Alert.alert('Error', 'Failed to start quest');
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteQuest = async () => {
    if (!quest) return;

    try {
      setStarting(true);
      const result = await callRpc('complete_quest', { quest_id: quest.id });

      if (result.success) {
        Alert.alert(
          'Quest Complete!',
          `Congratulations! You've completed "${quest.title}" and earned ${result.xp_reward} XP!`,
          [
            {
              text: 'Continue Exploring',
              onPress: () => {
                if (onQuestStarted) {
                  onQuestStarted();
                }
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to complete quest');
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      Alert.alert('Error', 'Failed to complete quest');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quest details...</Text>
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quest not found</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isActive = quest.user_status === 'active';
  const isCompleted = quest.user_status === 'completed';
  const canStart = quest.user_status === 'available';

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quest Image Placeholder */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📍</Text>
          </View>
        </View>

        {/* Quest Title */}
        <Text style={styles.title}>{quest.title}</Text>

        {/* Quest Description */}
        <Text style={styles.description}>{quest.description}</Text>

        {/* Quest Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⭐</Text>
            <Text style={styles.detailText}>{quest.xp_reward} XP</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>0/100 participants</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <Text style={styles.detailText}>90 mins</Text>
          </View>

          {isActive && quest.progress !== undefined && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress: {quest.progress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${quest.progress}%` }]} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartQuest}
            disabled={starting || !isConnected}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Join Quest</Text>
            )}
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteQuest}
            disabled={starting || !isConnected}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Complete Quest</Text>
            )}
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Text style={styles.completedButtonText}>✓ Completed</Text>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  progressContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#17B26A',
  },
  completeButton: {
    backgroundColor: '#FF9500',
  },
  completedButton: {
    backgroundColor: '#e0e0e0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

