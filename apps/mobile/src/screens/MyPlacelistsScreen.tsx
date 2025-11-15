import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlacelistDetailScreen } from './PlacelistDetailScreen';
import { CreateEditPlacelistScreen } from './CreateEditPlacelistScreen';

interface MyPlacelistsScreenProps {
  onClose?: () => void;
}

interface Placelist {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  privacy: 'private' | 'friends' | 'public';
  updatedAt: string;
  description?: string;
  createdBy?: string;
  ownerName?: string;
}

export const MyPlacelistsScreen: React.FC<MyPlacelistsScreenProps> = ({
  onClose,
}) => {
  const [myPlacelists, setMyPlacelists] = useState<Placelist[]>([
    {
      id: '1',
      name: 'Best Food Spots',
      icon: 'restaurant',
      color: '#FF69B4',
      count: 12,
      privacy: 'private',
      updatedAt: '2d ago',
    },
    {
      id: '2',
      name: 'Photo Spots',
      icon: 'camera',
      color: '#17B2B2',
      count: 8,
      privacy: 'friends',
      updatedAt: '1w ago',
    },
  ]);

  const [sharedPlacelists, setSharedPlacelists] = useState<Placelist[]>([
    {
      id: '3',
      name: 'Hidden Gems',
      icon: 'location',
      color: '#FF9500',
      count: 15,
      privacy: 'public',
      updatedAt: '3d ago',
      createdBy: 'mike',
      ownerName: 'Mike R.',
    },
  ]);

  const [selectedPlacelist, setSelectedPlacelist] = useState<Placelist | null>(null);
  const [showCreatePlacelist, setShowCreatePlacelist] = useState(false);
  const [editingPlacelist, setEditingPlacelist] = useState<Placelist | null>(null);

  const handlePlacelistPress = (placelist: Placelist) => {
    setSelectedPlacelist(placelist);
  };

  const handleCreatePlacelist = (newPlacelist: Partial<Placelist>) => {
    const created: Placelist = {
      id: Date.now().toString(),
      name: newPlacelist.name || 'New Placelist',
      icon: newPlacelist.icon || 'list',
      color: newPlacelist.color || '#17B2B2',
      count: 0,
      privacy: newPlacelist.privacy || 'private',
      updatedAt: 'just now',
      description: newPlacelist.description,
    };
    setMyPlacelists([created, ...myPlacelists]);
    setShowCreatePlacelist(false);
  };

  const handleEditPlacelist = (placelist: Placelist) => {
    setEditingPlacelist(placelist);
  };

  const handleUpdatePlacelist = (updated: Partial<Placelist>) => {
    if (editingPlacelist) {
      setMyPlacelists(
        myPlacelists.map((p) =>
          p.id === editingPlacelist.id ? { ...p, ...updated } : p
        )
      );
      setEditingPlacelist(null);
    }
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

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return '#f0f0f0';
      case 'friends':
        return '#E0F7F7';
      case 'public':
        return '#E0F7F7';
      default:
        return '#f0f0f0';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Placelists</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreatePlacelist(true)}
        >
          <Ionicons name="add" size={24} color="#17B2B2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* My Placelists Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Placelists</Text>
          {myPlacelists.map((placelist) => (
            <TouchableOpacity
              key={placelist.id}
              style={styles.placelistCard}
              onPress={() => handlePlacelistPress(placelist)}
            >
              <View style={[styles.placelistIcon, { backgroundColor: placelist.color }]}>
                <Ionicons name={placelist.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.placelistInfo}>
                <View style={styles.placelistHeader}>
                  <Text style={styles.placelistName}>{placelist.name}</Text>
                  <View
                    style={[
                      styles.privacyBadge,
                      { backgroundColor: getPrivacyColor(placelist.privacy) },
                    ]}
                  >
                    <Text style={styles.privacyBadgeText}>
                      {getPrivacyLabel(placelist.privacy)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.placelistMeta}>
                  {placelist.count} places • Updated {placelist.updatedAt}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditPlacelist(placelist);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shared with me Section */}
        {sharedPlacelists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared with me</Text>
            {sharedPlacelists.map((placelist) => (
              <TouchableOpacity
                key={placelist.id}
                style={styles.placelistCard}
                onPress={() => handlePlacelistPress(placelist)}
              >
                <View style={styles.sharedAvatar}>
                  <Text style={styles.sharedAvatarText}>
                    {placelist.ownerName?.charAt(0) || '👤'}
                  </Text>
                </View>
                <View style={styles.placelistInfo}>
                  <Text style={styles.placelistName}>{placelist.name}</Text>
                  <Text style={styles.placelistMeta}>
                    by {placelist.ownerName}
                  </Text>
                  <Text style={styles.placelistMeta}>
                    {placelist.count} places • Shared {placelist.updatedAt}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Placelist Detail Modal */}
      {selectedPlacelist && (
        <Modal
          visible={!!selectedPlacelist}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedPlacelist(null)}
        >
          <PlacelistDetailScreen
            placelist={selectedPlacelist}
            onClose={() => setSelectedPlacelist(null)}
            onUpdate={(updated) => {
              if (selectedPlacelist.id.startsWith('shared-')) {
                // Handle shared placelist updates if needed
              } else {
                setMyPlacelists(
                  myPlacelists.map((p) =>
                    p.id === selectedPlacelist.id ? { ...p, ...updated } : p
                  )
                );
              }
              setSelectedPlacelist(null);
            }}
          />
        </Modal>
      )}

      {/* Create/Edit Placelist Modal */}
      <Modal
        visible={showCreatePlacelist || !!editingPlacelist}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreatePlacelist(false);
          setEditingPlacelist(null);
        }}
      >
        <CreateEditPlacelistScreen
          placelist={editingPlacelist || undefined}
          onClose={() => {
            setShowCreatePlacelist(false);
            setEditingPlacelist(null);
          }}
          onSave={(data) => {
            if (editingPlacelist) {
              handleUpdatePlacelist(data);
            } else {
              handleCreatePlacelist(data);
            }
          }}
        />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  placelistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  placelistIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sharedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sharedAvatarText: {
    fontSize: 20,
  },
  placelistInfo: {
    flex: 1,
  },
  placelistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  placelistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  privacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  placelistMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

