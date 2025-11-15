import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UseItemModalProps {
  visible: boolean;
  item: {
    name: string;
    type: string;
    description?: string;
    effect?: string;
  } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const UseItemModal: React.FC<UseItemModalProps> = ({
  visible,
  item,
  onCancel,
  onConfirm,
}) => {
  if (!item) return null;

  // Get item-specific details
  const getItemDetails = () => {
    if (item.type === 'consumable') {
      // For blocker items
      if (item.name.toLowerCase().includes('blocker')) {
        return {
          icon: 'shield',
          iconColor: '#FF69B4',
          title: 'Use Blocker?',
          description: 'Block other players from accessing this location for 5 minutes',
        };
      }
      // For other consumables
      return {
        icon: 'cube',
        iconColor: '#17B2B2',
        title: `Use ${item.name}?`,
        description: item.effect || item.description || 'Use this item?',
      };
    }
    return {
      icon: 'cube',
      iconColor: '#17B2B2',
      title: `Use ${item.name}?`,
      description: item.description || 'Use this item?',
    };
  };

  const details = getItemDetails();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${details.iconColor}20` }]}>
            <View style={[styles.iconCircle, { backgroundColor: details.iconColor }]}>
              <Ionicons name={details.icon as any} size={32} color="#fff" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{details.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{details.description}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.useButton, { backgroundColor: details.iconColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.useButtonText}>Use Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  useButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});


