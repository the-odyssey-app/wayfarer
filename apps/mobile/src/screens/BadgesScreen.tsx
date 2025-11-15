import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BadgeDetailScreen } from './BadgeDetailScreen';

interface BadgesScreenProps {
  onClose?: () => void;
}

interface EarnedBadge {
  id: string;
  name: string;
  level: number;
  icon: string;
  color: string;
}

interface UpcomingBadge {
  id: string;
  name: string;
  description: string;
  progress: number;
  icon: string;
}

export const BadgesScreen: React.FC<BadgesScreenProps> = ({
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All Badges' | 'Explorer' | 'Quest' | 'Social'>('All Badges');
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);

  const earnedBadges: EarnedBadge[] = [
    { id: '1', name: 'Explorer', level: 3, icon: 'mountain', color: '#17B2B2' },
    { id: '2', name: 'Photographer', level: 2, icon: 'camera', color: '#FF9500' },
    { id: '3', name: 'Top Rated', level: 1, icon: 'star', color: '#FF69B4' },
  ];

  const upcomingBadges: UpcomingBadge[] = [
    {
      id: '1',
      name: 'Path Finder',
      description: 'Complete 5 more quests',
      progress: 80,
      icon: 'map',
    },
    {
      id: '2',
      name: 'Social Butterfly',
      description: 'Connect with 3 more friends',
      progress: 60,
      icon: 'people',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Badges</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Badge Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#17B2B2' }]}>24</Text>
            <Text style={styles.summaryLabel}>Earned</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#FF9500' }]}>12</Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#34C759' }]}>85%</Text>
            <Text style={styles.summaryLabel}>Progress</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['All Badges', 'Explorer', 'Quest', 'Social'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earned Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned Badges</Text>
          <View style={styles.earnedBadgesContainer}>
            {earnedBadges.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={styles.earnedBadgeItem}
                onPress={() => setSelectedBadge(badge)}
              >
                <View style={[styles.earnedBadgeIcon, { backgroundColor: badge.color }]}>
                  <Ionicons name={badge.icon as any} size={32} color="#fff" />
                </View>
                <Text style={styles.earnedBadgeName}>{badge.name}</Text>
                <Text style={styles.earnedBadgeLevel}>Level {badge.level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Badges</Text>
          {upcomingBadges.map((badge) => (
            <View key={badge.id} style={styles.upcomingBadgeCard}>
              <View style={styles.upcomingBadgeIcon}>
                <Ionicons name={badge.icon as any} size={24} color="#999" />
              </View>
              <View style={styles.upcomingBadgeInfo}>
                <Text style={styles.upcomingBadgeName}>{badge.name}</Text>
                <Text style={styles.upcomingBadgeDescription}>{badge.description}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${badge.progress}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
              <Text style={styles.progressPercentage}>{badge.progress}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <Modal
          visible={!!selectedBadge}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <BadgeDetailScreen
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        </Modal>
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
  infoButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  earnedBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  earnedBadgeItem: {
    alignItems: 'center',
  },
  earnedBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  earnedBadgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  earnedBadgeLevel: {
    fontSize: 12,
    color: '#666',
  },
  upcomingBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  upcomingBadgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingBadgeInfo: {
    flex: 1,
  },
  upcomingBadgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  upcomingBadgeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#17B2B2',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17B2B2',
    marginLeft: 12,
  },
});

