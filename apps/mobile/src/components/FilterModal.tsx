import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  currentFilter,
  onFilterChange,
}) => {
  const filterOptions = [
    { id: 'starting_soon', label: 'Starting Soon', icon: 'time' },
    { id: 'nearby', label: 'Near By', icon: 'location' },
    { id: 'duration', label: 'Duration', icon: 'hourglass' },
    { id: 'items', label: 'Items', icon: 'cube' },
  ];

  const handleFilterSelect = (filterId: string) => {
    if (currentFilter === filterId) {
      onFilterChange(null);
    } else {
      onFilterChange(filterId);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filter Quests</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Filter by:</Text>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                currentFilter === option.id && styles.filterOptionActive,
              ]}
              onPress={() => handleFilterSelect(option.id)}
            >
              <View style={styles.filterOptionContent}>
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={currentFilter === option.id ? '#17B2B2' : '#666'}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    currentFilter === option.id && styles.filterOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              {currentFilter === option.id && (
                <Ionicons name="checkmark" size={20} color="#17B2B2" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onFilterChange(null);
              onClose();
            }}
          >
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    borderColor: '#17B2B2',
    backgroundColor: '#E0F7F7',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#17B2B2',
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

