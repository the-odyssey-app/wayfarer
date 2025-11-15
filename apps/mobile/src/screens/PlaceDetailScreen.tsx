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
import { AudioDetailScreen } from './AudioDetailScreen';

interface PlaceDetailScreenProps {
  place: {
    id: string;
    name: string;
    location?: string;
    description?: string;
    image?: string;
  };
  onClose?: () => void;
}

interface AudioGuide {
  id: string;
  title: string;
  duration: string;
  price: string;
  isFree: boolean;
}

interface Moment {
  id: string;
  userName: string;
  userAvatar: string;
  status: string;
  image: string;
  likes: number;
  comments: number;
  timestamp?: string;
  text?: string;
}

export const PlaceDetailScreen: React.FC<PlaceDetailScreenProps> = ({
  place,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(true);
  const [selectedAudioGuide, setSelectedAudioGuide] = useState<AudioGuide | null>(null);

  const defaultPlace = {
    name: 'Pike Place Market',
    location: 'Seattle, Washington',
    description: 'Established in 1907, Pike Place Market is one of the oldest continuously operated public farmers\' markets in the United States.',
    image: 'pike place market entrance',
    ...place,
  };

  const audioGuides: AudioGuide[] = [
    {
      id: '1',
      title: 'Market History',
      duration: '05:32',
      price: 'Free',
      isFree: true,
    },
    {
      id: '2',
      title: 'Vendor Stories',
      duration: '07:15',
      price: '$2.99',
      isFree: false,
    },
  ];

  const moments: Moment[] = [
    {
      id: '1',
      userName: 'Mike R.',
      userAvatar: '👤',
      status: 'Quest Completed',
      image: 'night market scene with fish on ice',
      likes: 24,
      comments: 8,
    },
    {
      id: '2',
      userName: 'Sarah L.',
      userAvatar: '👤',
      status: 'Photo Challenge',
      image: 'market scene with fish stall',
      likes: 31,
      comments: 12,
    },
    {
      id: '3',
      userName: 'Alex K.',
      userAvatar: '👤',
      status: 'Audio Guide Complete',
      image: 'market scene with MARKET sign',
      likes: 42,
      comments: 15,
    },
    {
      id: '4',
      userName: 'Sarah L.',
      userAvatar: '👤',
      status: '',
      image: '',
      text: 'Just had the best fish and chips here! 🐟🍟',
      likes: 12,
      comments: 3,
      timestamp: '2h ago',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroImagePlaceholder}>
          <Text style={styles.heroImageText}>{defaultPlace.image}</Text>
        </View>
        
        {/* Navigation Arrows */}
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonLeft]}
          onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonRight]}
          onPress={() => setCurrentImageIndex(currentImageIndex + 1)}
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Top Actions */}
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroActionButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroActionButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF69B4' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Place Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.placeName}>{defaultPlace.name}</Text>
          {defaultPlace.location && (
            <Text style={styles.placeLocation}>{defaultPlace.location}</Text>
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Location</Text>
          <Text style={styles.descriptionText}>{defaultPlace.description}</Text>
        </View>

        {/* Audio Guides Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Guides</Text>
          {audioGuides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={styles.audioGuideCard}
              onPress={() => setSelectedAudioGuide(guide)}
            >
              <TouchableOpacity
                style={[
                  styles.playButton,
                  guide.isFree ? styles.playButtonActive : styles.playButtonInactive,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedAudioGuide(guide);
                }}
              >
                <Ionicons
                  name="play"
                  size={20}
                  color={guide.isFree ? '#fff' : '#999'}
                />
              </TouchableOpacity>
              <View style={styles.audioGuideInfo}>
                <Text style={styles.audioGuideTitle}>{guide.title}</Text>
                <Text style={styles.audioGuideMeta}>
                  {guide.duration} • {guide.price}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // More options
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Moments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moments</Text>
          {moments.map((moment) => (
            <View key={moment.id} style={styles.momentCard}>
              <View style={styles.momentHeader}>
                <View style={styles.momentUserInfo}>
                  <View style={styles.momentAvatar}>
                    <Text style={styles.momentAvatarText}>{moment.userAvatar}</Text>
                  </View>
                  <View style={styles.momentUserDetails}>
                    <Text style={styles.momentUserName}>{moment.userName}</Text>
                    {moment.status && (
                      <Text style={styles.momentStatus}>{moment.status}</Text>
                    )}
                    {moment.timestamp && (
                      <Text style={styles.momentTimestamp}>{moment.timestamp}</Text>
                    )}
                  </View>
                </View>
              </View>

              {moment.image && (
                <View style={styles.momentImageContainer}>
                  <View style={styles.momentImagePlaceholder}>
                    <Text style={styles.momentImageText}>{moment.image}</Text>
                  </View>
                </View>
              )}

              {moment.text && (
                <Text style={styles.momentText}>{moment.text}</Text>
              )}

              <View style={styles.momentEngagement}>
                <TouchableOpacity style={styles.engagementButton}>
                  <Ionicons name="heart-outline" size={18} color="#666" />
                  <Text style={styles.engagementText}>{moment.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.engagementButton}>
                  <Ionicons name="chatbubble-outline" size={18} color="#666" />
                  <Text style={styles.engagementText}>{moment.comments}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Audio Detail Modal */}
      {selectedAudioGuide && (
        <AudioDetailScreen
          audioGuide={{
            ...selectedAudioGuide,
            placeName: defaultPlace.name,
          }}
          onClose={() => setSelectedAudioGuide(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
  },
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  heroActions: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  placeLocation: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  audioGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonActive: {
    backgroundColor: '#17B2B2',
  },
  playButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  audioGuideInfo: {
    flex: 1,
  },
  audioGuideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioGuideMeta: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  momentHeader: {
    marginBottom: 12,
  },
  momentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  momentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  momentAvatarText: {
    fontSize: 20,
  },
  momentUserDetails: {
    flex: 1,
  },
  momentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  momentStatus: {
    fontSize: 12,
    color: '#17B2B2',
    fontWeight: '500',
  },
  momentTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  momentImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  momentImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  momentImageText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  momentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  momentEngagement: {
    flexDirection: 'row',
    gap: 16,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 14,
    color: '#666',
  },
});

