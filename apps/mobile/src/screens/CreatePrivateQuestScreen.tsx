import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreatePrivateQuestScreenProps {
  onClose: () => void;
  onSelectSolo: () => void;
  onSelectWithFriends: () => void;
}

export const CreatePrivateQuestScreen: React.FC<CreatePrivateQuestScreenProps> = ({
  onClose,
  onSelectSolo,
  onSelectWithFriends,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Private Quest</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>How would you like to play?</Text>

        {/* Go Solo Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={onSelectSolo}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="person" size={32} color="#17B2B2" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Go solo</Text>
            <Text style={styles.optionDescription}>
              Explore on your own at your own pace
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Go with Friends Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={onSelectWithFriends}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="people" size={32} color="#17B2B2" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Go with Friends</Text>
            <Text style={styles.optionDescription}>
              Create a quest and invite friends to join
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});


