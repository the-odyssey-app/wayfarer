import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface BadgeDetailScreenProps {
  badge: {
    id: string;
    name: string;
    level: number;
    icon: string;
    color: string;
    category?: string;
    earnedDate?: string;
    progress?: number;
    tasks?: Array<{ id: string; text: string; completed: boolean; progress?: number }>;
    relatedBadges?: Array<{ id: string; name: string; level: number; icon: string; color: string }>;
    description?: string;
  };
  onClose?: () => void;
}

export const BadgeDetailScreen: React.FC<BadgeDetailScreenProps> = ({
  badge,
  onClose,
}) => {
  const defaultBadge = {
    name: 'Explorer Master',
    category: 'Adventure Category',
    level: 3,
    earnedDate: 'March 15, 2025',
    progress: 80,
    tasks: [
      { id: '1', text: 'Complete 5 city tours', completed: true },
      { id: '2', text: 'Visit 10 landmarks', completed: true },
      { id: '3', text: 'Share 5 location reviews', completed: false, progress: 3 },
    ],
    relatedBadges: [
      { id: '1', name: 'Path Finder', level: 1, icon: 'map', color: '#999' },
      { id: '2', name: 'Navigator', level: 2, icon: 'book', color: '#FF9500' },
      { id: '3', name: 'Adventurer', level: 1, icon: 'compass', color: '#34C759' },
    ],
    description: 'Complete city exploration challenges, discover hidden gems, and share your experiences with the community. Unlock this badge by becoming a true urban explorer and helping others discover the city\'s secrets.',
    ...badge,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badge Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Badge Icon and Info */}
        <View style={styles.badgeHeader}>
          <View style={[styles.badgeIconLarge, { backgroundColor: defaultBadge.color || '#17B2B2' }]}>
            <Ionicons name={defaultBadge.icon as any || 'mountain'} size={64} color="#fff" />
          </View>
          <Text style={styles.badgeName}>{defaultBadge.name}</Text>
          <Text style={styles.badgeCategory}>
            {defaultBadge.category} • Level {defaultBadge.level}
          </Text>
          {defaultBadge.earnedDate && (
            <View style={styles.earnedBadge}>
              <Ionicons name="time-outline" size={14} color="#17B2B2" />
              <Text style={styles.earnedText}>Earned on {defaultBadge.earnedDate}</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <Text style={styles.progressPercentage}>{defaultBadge.progress || 0}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${defaultBadge.progress || 0}%` },
                ]}
              />
            </View>
          </View>
          {defaultBadge.tasks && (
            <View style={styles.tasksList}>
              {defaultBadge.tasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  {task.completed ? (
                    <Ionicons name="checkmark-circle" size={20} color="#17B2B2" />
                  ) : (
                    <View style={styles.taskProgressIcon}>
                      <Text style={styles.taskProgressText}>{task.progress || 0}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.taskText,
                      task.completed && styles.taskTextCompleted,
                    ]}
                  >
                    {task.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Related Badges Section */}
        {defaultBadge.relatedBadges && defaultBadge.relatedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Badges</Text>
            <View style={styles.relatedBadgesContainer}>
              {defaultBadge.relatedBadges.map((relatedBadge) => (
                <View key={relatedBadge.id} style={styles.relatedBadgeItem}>
                  <View style={[styles.relatedBadgeIcon, { backgroundColor: relatedBadge.color }]}>
                    <Ionicons name={relatedBadge.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.relatedBadgeName}>{relatedBadge.name}</Text>
                  <Text style={styles.relatedBadgeLevel}>Level {relatedBadge.level}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How to Earn Section */}
        {defaultBadge.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Earn</Text>
            <Text style={styles.descriptionText}>{defaultBadge.description}</Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  shareButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  badgeHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  badgeIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  badgeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  earnedText: {
    fontSize: 12,
    color: '#17B2B2',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17B2B2',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#17B2B2',
    borderRadius: 4,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskProgressIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  taskText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  taskTextCompleted: {
    color: '#333',
    textDecorationLine: 'line-through',
  },
  relatedBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 8,
  },
  relatedBadgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  relatedBadgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  relatedBadgeLevel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
});

