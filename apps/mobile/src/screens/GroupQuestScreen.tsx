import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface GroupQuestScreenProps {
  quest: {
    id: string;
    title: string;
    joinCode: string;
  };
  participants: Participant[];
  onClose: () => void;
  onOrganize: () => void;
}

// Mock participants - replace with actual data from backend
const generateMockParticipants = (count: number): Participant[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `participant-${i + 1}`,
    name: `Participant ${i + 1}`,
  }));
};

export const GroupQuestScreen: React.FC<GroupQuestScreenProps> = ({
  quest,
  participants,
  onClose,
  onOrganize,
}) => {
  const displayParticipants = participants.length > 0 
    ? participants 
    : generateMockParticipants(9);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group Quest</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Participants Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.participantsGrid}>
          {displayParticipants.map((participant, index) => (
            <View key={participant.id} style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#999" />
              </View>
            </View>
          ))}
        </View>

        {/* Decorative Dots */}
        <View style={styles.decorativeDots}>
          <View style={[styles.dot, styles.dotPink]} />
          <View style={[styles.dot, styles.dotTeal]} />
          <View style={[styles.dot, styles.dotOrange]} />
          <View style={[styles.dot, styles.dotPink]} />
          <View style={[styles.dot, styles.dotTeal]} />
        </View>
      </ScrollView>

      {/* Organize Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.organizeButton} onPress={onOrganize}>
          <Text style={styles.organizeButtonText}>Organize</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    minHeight: '100%',
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  avatarContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 20,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  decorativeDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotPink: {
    backgroundColor: '#FF69B4',
  },
  dotTeal: {
    backgroundColor: '#17B2B2',
  },
  dotOrange: {
    backgroundColor: '#FF9500',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  organizeButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  organizeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});


