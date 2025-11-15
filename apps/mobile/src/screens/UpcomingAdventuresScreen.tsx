import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrivateQuest {
  id: string;
  title: string;
  description: string;
  joinCode: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
}

interface UpcomingAdventuresScreenProps {
  onClose: () => void;
  onQuestSelect: (quest: PrivateQuest) => void;
}

// Mock data - replace with actual data from backend
const mockPrivateQuests: PrivateQuest[] = [
  {
    id: '1',
    title: 'Nature Walk',
    description: 'Find hidden trail',
    joinCode: 'XHIMOS',
    date: '3/24/2025',
    time: '3:00pm',
    participants: 4,
    maxParticipants: 6,
  },
  {
    id: '2',
    title: 'City Explorer',
    description: 'Urban adventure quest',
    joinCode: 'KPLM2N',
    date: '3/25/2025',
    time: '2:00pm',
    participants: 2,
    maxParticipants: 6,
  },
  {
    id: '3',
    title: 'Photo Hunt',
    description: 'Capture city landmarks',
    joinCode: 'WPQR7S',
    date: '3/26/2025',
    time: '4:00pm',
    participants: 3,
    maxParticipants: 6,
  },
];

export const UpcomingAdventuresScreen: React.FC<UpcomingAdventuresScreenProps> = ({
  onClose,
  onQuestSelect,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Adventures with Friends</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Adventure with Friends</Text>
      </View>

      {/* Quest List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {mockPrivateQuests.map((quest) => (
          <TouchableOpacity
            key={quest.id}
            style={styles.questCard}
            onPress={() => onQuestSelect(quest)}
          >
            <View style={styles.questCardContent}>
              <View style={styles.questCardLeft}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <Text style={styles.questDescription}>{quest.description}</Text>
                <View style={styles.questMetaRow}>
                  <View style={styles.questMetaItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.questMetaText}>
                      {quest.date} {quest.time}
                    </Text>
                  </View>
                  <View style={styles.questMetaItem}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.questMetaText}>
                      {quest.participants}/{quest.maxParticipants}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.questCardRight}>
                <Text style={styles.joinCodeLabel}>Join Code</Text>
                <Text style={styles.joinCode}>{quest.joinCode}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.organizeButton}
              onPress={() => onQuestSelect(quest)}
            >
              <Text style={styles.organizeButtonText}>Organize</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questCardLeft: {
    flex: 1,
  },
  questCardRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  questMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  questMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  questMetaText: {
    fontSize: 14,
    color: '#666',
  },
  joinCodeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  joinCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  organizeButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  organizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


