import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNakama } from '../contexts/NakamaContext';

interface CreatingQuestScreenProps {
  questType: 'mystery' | 'scavenger_hunt' | 'with_friends';
  userLocation?: { latitude: number; longitude: number };
  isGroupQuest?: boolean;
  onQuestCreated?: (questId?: string, joinCode?: string, questTitle?: string) => void;
  onError?: (error: string) => void;
}

export const CreatingQuestScreen: React.FC<CreatingQuestScreenProps> = ({
  questType,
  userLocation,
  isGroupQuest = false,
  onQuestCreated,
  onError,
}) => {
  const { callRpc } = useNakama();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createQuest = async () => {
      try {
        if (!userLocation) {
          const errorMessage = 'Location is required to create a quest';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
          return;
        }

        // Use the original create_quest_from_location RPC with questType parameter
        let questTypeParam: string;
        
        if (questType === 'mystery') {
          questTypeParam = 'mystery';
        } else if (questType === 'scavenger_hunt') {
          questTypeParam = 'scavenger';
        } else {
          // with_friends - This should not happen as we handle it via isGroupQuest flag
          const errorMessage = 'Invalid quest type';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
          return;
        }

        const payload = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          questType: questTypeParam,
          isGroup: isGroupQuest,
          numStops: 10,
          maxDistanceKm: 10,
        };

        // Call the original RPC to create quest
        const result = await callRpc('create_quest_from_location', payload);

        if (result.success && onQuestCreated) {
          const questId = result.quest_id || result.questId;
          const joinCode = result.join_code || result.joinCode;
          const questTitle = result.title || result.quest_title || `${questType === 'mystery' ? 'Mystery' : 'Scavenger Hunt'} Quest`;
          onQuestCreated(questId, joinCode, questTitle);
        } else {
          const errorMessage = result.error || 'Failed to create quest';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An error occurred while creating the quest';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    createQuest();
  }, [questType, userLocation, callRpc, onQuestCreated, onError]);

  const getQuestTypeName = () => {
    switch (questType) {
      case 'mystery':
        return 'Mystery Quest';
      case 'scavenger_hunt':
        return 'Scavenger Hunt';
      case 'with_friends':
        return 'Friends Quest';
      default:
        return 'Quest';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="create-outline" size={64} color="#17B2B2" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Creating Your Quest</Text>

        {/* Quest Type */}
        <Text style={styles.questType}>{getQuestTypeName()}</Text>

        {/* Loading Indicator */}
        <ActivityIndicator size="large" color="#17B2B2" style={styles.loader} />

        {/* Message */}
        <Text style={styles.message}>
          We're setting up your adventure...
        </Text>
        <Text style={styles.subMessage}>
          This will just take a moment
        </Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  questType: {
    fontSize: 18,
    color: '#17B2B2',
    marginBottom: 32,
    fontWeight: '600',
  },
  loader: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
});


