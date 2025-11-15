import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceDetailScreen } from './PlaceDetailScreen';

interface PlacelistDetailScreenProps {
  placelist: {
    id: string;
    name: string;
    icon: string;
    color: string;
    count: number;
    privacy: 'private' | 'friends' | 'public';
    updatedAt?: string;
    description?: string;
    createdBy?: string;
    ownerName?: string;
  };
  onClose?: () => void;
  onUpdate?: (updated: any) => void;
}

interface Place {
  id: string;
  name: string;
  address: string;
  icon: string;
  color: string;
  privateNote?: string;
}

export const PlacelistDetailScreen: React.FC<PlacelistDetailScreenProps> = ({
  placelist,
  onClose,
  onUpdate,
}) => {
  const [places, setPlaces] = useState<Place[]>([
    {
      id: '1',
      name: 'Pike Place Chowder',
      address: '1530 Post Alley, Seattle',
      icon: 'restaurant',
      color: '#FF9500',
    },
    {
      id: '2',
      name: 'Starbucks Reserve',
      address: '1124 Pike St, Seattle',
      icon: 'cafe',
      color: '#17B2B2',
    },
  ]);

  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedPlaceForNote, setSelectedPlaceForNote] = useState<Place | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleAddNote = (place: Place) => {
    setSelectedPlaceForNote(place);
    setNoteText(place.privateNote || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (selectedPlaceForNote) {
      setPlaces(
        places.map((p) =>
          p.id === selectedPlaceForNote.id ? { ...p, privateNote: noteText } : p
        )
      );
      setShowNoteModal(false);
      setSelectedPlaceForNote(null);
      setNoteText('');
    }
  };

  const handleRemovePlace = (placeId: string) => {
    Alert.alert('Remove Place', 'Are you sure you want to remove this place?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPlaces(places.filter((p) => p.id !== placeId));
          if (onUpdate) {
            onUpdate({ count: places.length - 1 });
          }
        },
      },
    ]);
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return 'Private';
      case 'friends':
        return 'Friends';
      case 'public':
        return 'Public';
      default:
        return 'Private';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    // Simple date formatting - in production, use a proper date library
    return dateString;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{placelist.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Placelist Info */}
        <View style={styles.placelistInfo}>
          <View style={[styles.placelistIcon, { backgroundColor: placelist.color }]}>
            <Ionicons name={placelist.icon as any} size={32} color="#fff" />
          </View>
          <View style={styles.placelistDetails}>
            <View style={styles.privacyBadge}>
              <Text style={styles.privacyBadgeText}>{getPrivacyLabel(placelist.privacy)}</Text>
            </View>
            <Text style={styles.createdDate}>
              Created {placelist.updatedAt || 'Jan 15, 2025'}
            </Text>
            {placelist.description && (
              <Text style={styles.description}>{placelist.description}</Text>
            )}
          </View>
        </View>

        {/* Places List */}
        <View style={styles.placesSection}>
          <View style={styles.placesHeader}>
            <Text style={styles.placesCount}>{places.length} Places</Text>
            <TouchableOpacity onPress={() => setShowAddLocation(true)}>
              <Text style={styles.addLocationLink}>+ Add Location</Text>
            </TouchableOpacity>
          </View>

          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeCard}
              onPress={() => setSelectedPlace(place)}
            >
              <View style={[styles.placeIcon, { backgroundColor: place.color }]}>
                <Ionicons name={place.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress}>{place.address}</Text>
                {place.privateNote && (
                  <View style={styles.noteIndicator}>
                    <Ionicons name="document-text" size={12} color="#999" />
                    <Text style={styles.noteIndicatorText}>Has private note</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.placeMoreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddNote(place);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
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

      {/* Add Location Modal - Placeholder */}
      <Modal
        visible={showAddLocation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddLocation(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddLocation(false)}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Location</Text>
            <View style={styles.modalHeaderRight} />
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Search and add locations to this placelist
            </Text>
            {/* Implement location search here */}
          </View>
        </View>
      </Modal>

      {/* Private Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowNoteModal(false);
          setSelectedPlaceForNote(null);
          setNoteText('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowNoteModal(false);
                setSelectedPlaceForNote(null);
                setNoteText('');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Private Note</Text>
            <TouchableOpacity onPress={handleSaveNote}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.noteLabel}>Add a private note for {selectedPlaceForNote?.name}</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={6}
              placeholder="Enter your private note..."
              value={noteText}
              onChangeText={setNoteText}
              placeholderTextColor="#999"
            />
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  placelistInfo: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  placelistIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placelistDetails: {
    flex: 1,
  },
  privacyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  createdDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  placesSection: {
    padding: 20,
  },
  placesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  placesCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addLocationLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17B2B2',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  placeIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
  },
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  noteIndicatorText: {
    fontSize: 12,
    color: '#999',
  },
  placeMoreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalHeaderRight: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 150,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17B2B2',
  },
});

