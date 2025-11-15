import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateEditPlacelistScreenProps {
  placelist?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    privacy: 'private' | 'friends' | 'public';
    description?: string;
  };
  onClose?: () => void;
  onSave?: (data: PlacelistData) => void;
}

interface PlacelistData {
  name: string;
  description?: string;
  icon: string;
  color: string;
  privacy: 'private' | 'friends' | 'public';
}

interface Location {
  id: string;
  name: string;
  address: string;
  icon: string;
  color: string;
  isAdded: boolean;
}

export const CreateEditPlacelistScreen: React.FC<CreateEditPlacelistScreenProps> = ({
  placelist,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(placelist?.name || '');
  const [description, setDescription] = useState(placelist?.description || '');
  const [isPrivate, setIsPrivate] = useState(placelist?.privacy === 'private' || true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(placelist?.icon || 'list');
  const [selectedColor, setSelectedColor] = useState(placelist?.color || '#17B2B2');

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Pike Place Market',
      address: 'Downtown Seattle',
      icon: 'location',
      color: '#FF9500',
      isAdded: false,
    },
    {
      id: '2',
      name: 'Space Needle',
      address: 'Seattle Center',
      icon: 'business',
      color: '#34C759',
      isAdded: false,
    },
  ]);

  useEffect(() => {
    if (placelist) {
      setName(placelist.name);
      setDescription(placelist.description || '');
      setIsPrivate(placelist.privacy === 'private');
      setSelectedIcon(placelist.icon);
      setSelectedColor(placelist.color);
    }
  }, [placelist]);

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLocation = (locationId: string) => {
    setLocations(
      locations.map((loc) =>
        loc.id === locationId ? { ...loc, isAdded: !loc.isAdded } : loc
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a placelist name');
      return;
    }

    if (onSave) {
      onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        privacy: isPrivate ? 'private' : 'friends',
      });
    }

    if (onClose) {
      onClose();
    }
  };

  const iconOptions = [
    { name: 'list', label: 'List' },
    { name: 'restaurant', label: 'Food' },
    { name: 'camera', label: 'Photo' },
    { name: 'location', label: 'Location' },
    { name: 'heart', label: 'Favorite' },
    { name: 'star', label: 'Star' },
  ];

  const colorOptions = [
    '#17B2B2',
    '#FF69B4',
    '#FF9500',
    '#34C759',
    '#007AFF',
    '#AF52DE',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {placelist ? 'Edit Placelist' : 'Create Placelist'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Placelist Name Input */}
        <View style={styles.inputSection}>
          <View style={[styles.inputIcon, { backgroundColor: selectedColor }]}>
            <Ionicons name={selectedIcon as any} size={24} color="#fff" />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder="Placelist Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a description..."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
              multiline
            />
          </View>
        </View>

        {/* Private Placelist Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleLeft}>
            <Ionicons name="lock-closed" size={20} color="#333" />
            <Text style={styles.toggleLabel}>Private Placelist</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: '#f0f0f0', true: '#17B2B2' }}
            thumbColor="#fff"
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon</Text>
          <View style={styles.iconGrid}>
            {iconOptions.map((icon) => (
              <TouchableOpacity
                key={icon.name}
                style={[
                  styles.iconOption,
                  selectedIcon === icon.name && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon.name)}
              >
                <View
                  style={[
                    styles.iconOptionCircle,
                    { backgroundColor: selectedColor },
                  ]}
                >
                  <Ionicons name={icon.name as any} size={20} color="#fff" />
                </View>
                <Text style={styles.iconOptionLabel}>{icon.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Locations</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations to add..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Locations List */}
          <View style={styles.locationsList}>
            {filteredLocations.map((location) => (
              <View key={location.id} style={styles.locationCard}>
                <View style={[styles.locationIcon, { backgroundColor: location.color }]}>
                  <Ionicons name={location.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    location.isAdded && styles.addButtonAdded,
                  ]}
                  onPress={() => handleToggleLocation(location.id)}
                >
                  <Ionicons
                    name={location.isAdded ? 'checkmark' : 'add'}
                    size={20}
                    color={location.isAdded ? '#fff' : '#17B2B2'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#17B2B2',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#666',
    minHeight: 40,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  iconOption: {
    alignItems: 'center',
    width: '30%',
  },
  iconOptionSelected: {
    // Add selection indicator if needed
  },
  iconOptionCircle: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconOptionLabel: {
    fontSize: 12,
    color: '#666',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  locationsList: {
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonAdded: {
    backgroundColor: '#17B2B2',
  },
});

