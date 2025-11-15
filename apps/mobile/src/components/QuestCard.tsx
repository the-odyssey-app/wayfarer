import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    estimated_time_minutes?: number;
    max_participants?: number;
    current_participants?: number;
    reward_xp?: number;
    start_time?: string;
    image_url?: string;
  };
  onJoin?: () => void;
  onClose?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onJoin,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatStartTime = (startTime?: string): string => {
    if (!startTime) return 'Starting soon';
    
    try {
      const date = new Date(startTime);
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      return `${timeStr} on ${dateStr}`;
    } catch {
      return 'Starting soon';
    }
  };

  const formatTimeUntilStart = (startTime?: string): string => {
    if (!startTime) return 'Starting soon';
    
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 0) return 'Started';
    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h`;
  };

  if (!isExpanded) {
    // Compact view
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.9}
      >
        {/* Close button */}
        {onClose && (
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Quest Image */}
        <View style={styles.imageContainer}>
          {quest.image_url ? (
            <Image source={{ uri: quest.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image" size={40} color="#999" />
            </View>
          )}
        </View>

        {/* Quest Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {quest.description}
          </Text>

          {/* Quest Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {quest.estimated_time_minutes || 45} min
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {quest.current_participants || 0}/{quest.max_participants || 100}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.detailText}>
                {quest.reward_xp || 100} XP
              </Text>
            </View>

            {quest.start_time && (
              <View style={styles.detailItem}>
                <Ionicons name="hourglass-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {formatTimeUntilStart(quest.start_time)}
                </Text>
              </View>
            )}
          </View>

          {/* Join Button */}
          <TouchableOpacity 
            style={styles.joinButton} 
            onPress={(e) => {
              e.stopPropagation();
              if (onJoin) onJoin();
            }}
          >
            <Text style={styles.joinButtonText}>Join Quest</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Expanded view
  return (
    <View style={styles.expandedContainer}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={styles.expandedCloseButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Quest Image */}
      <View style={styles.expandedImageContainer}>
        {quest.image_url ? (
          <Image source={{ uri: quest.image_url }} style={styles.expandedImage} />
        ) : (
          <View style={styles.expandedImagePlaceholder}>
            <Ionicons name="image" size={60} color="#999" />
          </View>
        )}
      </View>

      {/* Quest Content */}
      <View style={styles.expandedContent}>
        <Text style={styles.expandedTitle}>{quest.title}</Text>
        <Text style={styles.expandedDescription}>{quest.description}</Text>

        {/* Quest Details in Two Columns */}
        <View style={styles.expandedDetailsContainer}>
          {/* Left Column */}
          <View style={styles.expandedDetailsColumn}>
            <View style={styles.expandedDetailItem}>
              <Ionicons name="time-outline" size={20} color="#34C759" />
              <Text style={styles.expandedDetailText}>
                {quest.start_time ? formatStartTime(quest.start_time) : 'Starting soon'}
              </Text>
            </View>

            <View style={styles.expandedDetailItem}>
              <Ionicons name="star" size={20} color="#FF9500" />
              <Text style={styles.expandedDetailText}>
                {quest.reward_xp || 100} XP
              </Text>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.expandedDetailsColumn}>
            <View style={styles.expandedDetailItem}>
              <Ionicons name="people-outline" size={20} color="#FF69B4" />
              <Text style={styles.expandedDetailText}>
                {quest.current_participants || 0}/{quest.max_participants || 100}
              </Text>
            </View>

            <View style={styles.expandedDetailItem}>
              <Ionicons name="hourglass-outline" size={20} color="#007AFF" />
              <Text style={styles.expandedDetailText}>
                {quest.estimated_time_minutes || 90} mins
              </Text>
            </View>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity style={styles.expandedJoinButton} onPress={onJoin}>
          <Text style={styles.expandedJoinButtonText}>Join Quest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  expandedContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    width: '95%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  expandedImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F7F7',
  },
  expandedImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F7F7',
  },
  content: {
    padding: 16,
  },
  expandedContent: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  expandedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  expandedDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  expandedDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 20,
  },
  expandedDetailsColumn: {
    flex: 1,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  expandedDetailText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  expandedJoinButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedJoinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

