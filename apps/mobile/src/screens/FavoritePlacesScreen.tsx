import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PlaceDetailScreen } from './PlaceDetailScreen';

interface FavoritePlacesScreenProps {
  onClose?: () => void;
}

interface FavoritePlace {
  id: string;
  name: string;
  addedDate: string;
  category: 'Market' | 'Landmark' | 'Historical' | 'Park';
  image: string;
}

export const FavoritePlacesScreen: React.FC<FavoritePlacesScreenProps> = ({
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All Places' | 'Historical' | 'Markets' | 'Landmarks'>('All Places');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);

  const favoritePlaces: FavoritePlace[] = [
    {
      id: '1',
      name: 'Pike Place Market',
      addedDate: 'Jan 15, 2025',
      category: 'Market',
      image: 'pike place market',
    },
    {
      id: '2',
      name: 'Space Needle',
      addedDate: 'Jan 10, 2025',
      category: 'Landmark',
      image: 'space needle',
    },
    {
      id: '3',
      name: '5th Avenue Theatre',
      addedDate: 'Jan 5, 2025',
      category: 'Historical',
      image: '5th avenue theatre',
    },
    {
      id: '4',
      name: 'Olympic Park',
      addedDate: 'Jan 1, 2025',
      category: 'Park',
      image: 'olympic park',
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Market':
        return { name: 'bag', color: '#FFD700' };
      case 'Landmark':
        return { name: 'business', color: '#34C759' };
      case 'Historical':
        return { name: 'document-text', color: '#17B2B2' };
      case 'Park':
        return { name: 'leaf', color: '#34C759' };
      default:
        return { name: 'location', color: '#999' };
    }
  };

  const filteredPlaces = activeFilter === 'All Places'
    ? favoritePlaces
    : favoritePlaces.filter(place => {
        if (activeFilter === 'Markets') return place.category === 'Market';
        if (activeFilter === 'Landmarks') return place.category === 'Landmark';
        if (activeFilter === 'Historical') return place.category === 'Historical';
        return true;
      });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Places</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons name="grid" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="filter" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['All Places', 'Historical', 'Markets', 'Landmarks'] as const).map((filter) => (
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

      {/* Places Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.placesGrid}>
          {filteredPlaces.map((place) => {
            const categoryIcon = getCategoryIcon(place.category);
            return (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => setSelectedPlace(place)}
              >
                <View style={styles.placeImageContainer}>
                  <View style={styles.placeImagePlaceholder}>
                    <Text style={styles.placeImageText}>{place.image}</Text>
                  </View>
                  <TouchableOpacity style={styles.favoriteIcon}>
                    <Ionicons name="heart" size={20} color="#FF69B4" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeDate}>Added {place.addedDate}</Text>
                <View style={styles.placeCategory}>
                  <Ionicons
                    name={categoryIcon.name as any}
                    size={14}
                    color={categoryIcon.color}
                  />
                  <Text style={styles.placeCategoryText}>{place.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Place Detail Modal */}
      {selectedPlace && (
        <Modal
          visible={!!selectedPlace}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedPlace(null)}
        >
          <PlaceDetailScreen
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  placeCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  placeImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  placeImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  placeImageText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  placeDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  placeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
  },
  placeCategoryText: {
    fontSize: 12,
    color: '#999',
  },
});

