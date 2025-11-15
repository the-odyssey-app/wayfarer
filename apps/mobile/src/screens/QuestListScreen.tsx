import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  difficulty: number;
  xp_reward: number;
  user_status: string;
  distance_miles?: number;
}

interface QuestListScreenProps {
  onQuestSelect: (questId: string) => void;
  userLocation?: { lat: number; lng: number };
}

export const QuestListScreen: React.FC<QuestListScreenProps> = ({
  onQuestSelect,
  userLocation,
}) => {
  const { callRpc, isConnected } = useNakama();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, [userLocation]);

  useEffect(() => {
    applyFilters();
  }, [quests, searchQuery, distanceFilter, difficultyFilter, statusFilter]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const payload = userLocation
        ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            maxDistanceKm: 10,
          }
        : undefined;

      const result = await callRpc('get_available_quests', payload);

      if (result.success && result.quests) {
        setQuests(result.quests);
        setFilteredQuests(result.quests);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuests();
  };

  const applyFilters = () => {
    let filtered = [...quests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quest => 
        quest.title.toLowerCase().includes(query) ||
        quest.description.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== null) {
      filtered = filtered.filter(quest => quest.difficulty === difficultyFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(quest => quest.user_status === statusFilter);
    }

    // Distance filter (if distance info available)
    if (distanceFilter !== null && userLocation) {
      // Note: This would require distance calculation if not already in quest data
      // For now, we'll just use the existing distance_miles if available
    }

    setFilteredQuests(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDistanceFilter(null);
    setDifficultyFilter(null);
    setStatusFilter(null);
  };

  const hasActiveFilters = searchQuery || distanceFilter !== null || difficultyFilter !== null || statusFilter !== null;

  const renderQuestItem = ({ item }: { item: Quest }) => {
    const isActive = item.user_status === 'active';
    const isCompleted = item.user_status === 'completed';

    return (
      <TouchableOpacity
        style={styles.questCard}
        onPress={() => onQuestSelect(item.id)}
        activeOpacity={0.7}
      >
        {/* Quest Image Placeholder */}
        <View style={styles.questImageContainer}>
          <View style={styles.questImagePlaceholder}>
            <Text style={styles.questImageIcon}>📍</Text>
          </View>
        </View>

        {/* Quest Content */}
        <View style={styles.questContent}>
          <Text style={styles.questTitle}>{item.title}</Text>
          <Text style={styles.questDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Quest Metadata */}
          <View style={styles.questMetadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⏱️</Text>
              <Text style={styles.metadataText}>90 min</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⭐</Text>
              <Text style={styles.metadataText}>{item.xp_reward} XP</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>👥</Text>
              <Text style={styles.metadataText}>0/100</Text>
            </View>

            {item.distance_miles && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>📍</Text>
                <Text style={styles.metadataText}>
                  {item.distance_miles.toFixed(1)} mi
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          {isActive && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          )}

          {isCompleted && (
            <View style={[styles.statusBadge, styles.completedBadge]}>
              <Text style={styles.statusBadgeText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        <View style={styles.joinButtonContainer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              isActive && styles.activeButton,
              isCompleted && styles.completedButton,
            ]}
            onPress={() => onQuestSelect(item.id)}
            disabled={isCompleted}
          >
            <Text
              style={[
                styles.joinButtonText,
                isCompleted && styles.completedButtonText,
              ]}
            >
              {isCompleted ? 'Completed' : isActive ? 'Continue' : 'Join Quest'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            Filters {hasActiveFilters ? '●' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredQuests}
        renderItem={renderQuestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No quests match your filters' : 'No quests available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {hasActiveFilters 
                ? 'Try adjusting your filters' 
                : 'Check back later for new adventures!'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Difficulty Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Difficulty</Text>
              <View style={styles.filterOptions}>
                {[1, 2, 3].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterOption,
                      difficultyFilter === level && styles.filterOptionActive
                    ]}
                    onPress={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      difficultyFilter === level && styles.filterOptionTextActive
                    ]}>
                      {['Easy', 'Medium', 'Hard'][level - 1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {['available', 'active', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      statusFilter === status && styles.filterOptionActive
                    ]}
                    onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      statusFilter === status && styles.filterOptionTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Distance</Text>
              <View style={styles.filterOptions}>
                {[1, 5, 10, 20].map((km) => (
                  <TouchableOpacity
                    key={km}
                    style={[
                      styles.filterOption,
                      distanceFilter === km && styles.filterOptionActive
                    ]}
                    onPress={() => setDistanceFilter(distanceFilter === km ? null : km)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      distanceFilter === km && styles.filterOptionTextActive
                    ]}>
                      {km} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearFiltersButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  questCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  questImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  questImageIcon: {
    fontSize: 48,
  },
  questContent: {
    padding: 16,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButtonContainer: {
    padding: 16,
    paddingTop: 0,
  },
  joinButton: {
    backgroundColor: '#17B26A',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF9500',
  },
  completedButton: {
    backgroundColor: '#e0e0e0',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  filterButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersButton: {
    backgroundColor: '#f0f0f0',
  },
  clearFiltersButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

