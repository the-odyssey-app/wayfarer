import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNakama } from '../contexts/NakamaContext';
import { AudioDetailScreen } from './AudioDetailScreen';
import { MoreOptionsMenu } from '../components/MoreOptionsMenu';
import { ShareService } from '../services/ShareService';

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
  price_coins?: number;
  isFree: boolean;
  is_purchased?: boolean;
  audio_url?: string;
  description?: string;
  language?: string;
  avg_rating?: number;
  rating_count?: number;
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
  const { callRpc } = useNakama();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(true);
  const [selectedAudioGuide, setSelectedAudioGuide] = useState<AudioGuide | null>(null);
  const [audioGuides, setAudioGuides] = useState<AudioGuide[]>([]);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState<{ guideId: string; x: number; y: number } | null>(null);
  const [likedMoments, setLikedMoments] = useState<Set<string>>(new Set());

  const defaultPlace = {
    name: 'Pike Place Market',
    location: 'Seattle, Washington',
    description: 'Established in 1907, Pike Place Market is one of the oldest continuously operated public farmers\' markets in the United States.',
    image: 'pike place market entrance',
    ...place,
  };

  // Fetch audio experiences for this place
  useEffect(() => {
    const fetchAudioExperiences = async () => {
      try {
        setLoadingAudio(true);
        // Try to get audio experiences by place name or location
        const result = await callRpc('get_audio_experiences', {
          place_name: place.name,
          latitude: (place as any).latitude,
          longitude: (place as any).longitude,
        });

        if (result.success && result.audio_experiences) {
          const guides: AudioGuide[] = result.audio_experiences.map((audio: any) => ({
            id: audio.id,
            title: audio.title,
            duration: formatDuration(audio.duration_seconds || 0),
            price: audio.price_coins === 0 ? 'Free' : `${audio.price_coins} coins`,
            price_coins: audio.price_coins || 0,
            isFree: audio.price_coins === 0,
            is_purchased: audio.is_purchased || false,
            audio_url: audio.audio_url,
            description: audio.description,
            language: audio.language || 'English',
            avg_rating: audio.avg_rating,
            rating_count: audio.rating_count || 0,
          }));
          setAudioGuides(guides);
        } else {
          // Fallback to empty array if no audio experiences found
          setAudioGuides([]);
        }
      } catch (error) {
        console.error('Error fetching audio experiences:', error);
        setAudioGuides([]);
      } finally {
        setLoadingAudio(false);
      }
    };

    fetchAudioExperiences();
  }, [place.id, place.name]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchaseAudio = async (guide: AudioGuide) => {
    try {
      const result = await callRpc('purchase_audio', {
        audioExperienceId: guide.id,
      });

      if (result.success) {
        Alert.alert('Success', 'Audio guide purchased successfully!');
        // Refresh audio guides to update purchase status
        const updatedGuides = audioGuides.map(g =>
          g.id === guide.id ? { ...g, is_purchased: true, isFree: true } : g
        );
        setAudioGuides(updatedGuides);
      } else {
        Alert.alert('Error', result.error || 'Failed to purchase audio guide');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to purchase audio guide');
    }
  };

  const [moments, setMoments] = useState<Moment[]>([
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
  ]);

  const handleLikeMoment = async (momentId: string) => {
    const isLiked = likedMoments.has(momentId);
    const newLikedMoments = new Set(likedMoments);
    
    if (isLiked) {
      newLikedMoments.delete(momentId);
      // Decrease like count
      setMoments(prev => prev.map(m => 
        m.id === momentId ? { ...m, likes: Math.max(0, m.likes - 1) } : m
      ));
    } else {
      newLikedMoments.add(momentId);
      // Increase like count
      setMoments(prev => prev.map(m => 
        m.id === momentId ? { ...m, likes: m.likes + 1 } : m
      ));
    }
    
    setLikedMoments(newLikedMoments);
    
    // TODO: Call API to update like status
    try {
      await callRpc('like_moment', { momentId, liked: !isLiked });
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const handleShareMoment = async (moment: Moment) => {
    try {
      const { ShareService } = await import('../services/ShareService');
      await ShareService.shareMoment({
        userName: moment.userName,
        text: moment.text,
        placeName: defaultPlace.name,
      });
    } catch (error) {
      console.error('Error sharing moment:', error);
      // Fallback handled by ShareService
    }
  };

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
          {loadingAudio ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#17B2B2" />
              <Text style={styles.loadingText}>Loading audio guides...</Text>
            </View>
          ) : audioGuides.length === 0 ? (
            <Text style={styles.emptyText}>No audio guides available for this location</Text>
          ) : (
            audioGuides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={styles.audioGuideCard}
              onPress={() => setSelectedAudioGuide(guide)}
            >
              <TouchableOpacity
                style={[
                  styles.playButton,
                  (guide.isFree || guide.is_purchased) ? styles.playButtonActive : styles.playButtonInactive,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (guide.isFree || guide.is_purchased) {
                  setSelectedAudioGuide(guide);
                  } else {
                    handlePurchaseAudio(guide);
                  }
                }}
              >
                <Ionicons
                  name="play"
                  size={20}
                  color={(guide.isFree || guide.is_purchased) ? '#fff' : '#999'}
                />
              </TouchableOpacity>
              <View style={styles.audioGuideInfo}>
                <Text style={styles.audioGuideTitle}>{guide.title}</Text>
                <Text style={styles.audioGuideMeta}>
                  {guide.duration} • {guide.is_purchased ? 'Purchased' : guide.price}
                  {guide.avg_rating && guide.rating_count > 0 && (
                    <Text style={styles.ratingText}> • ⭐ {guide.avg_rating.toFixed(1)} ({guide.rating_count})</Text>
                  )}
                </Text>
              </View>
              {!guide.isFree && !guide.is_purchased && (
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePurchaseAudio(guide);
                  }}
                >
                  <Text style={styles.purchaseButtonText}>Buy</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Show more options menu
                  setShowMoreOptions({ guideId: guide.id, x: 0, y: 0 });
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
              </TouchableOpacity>
              {showMoreOptions && showMoreOptions.guideId === guide.id && (
                <MoreOptionsMenu
                  visible={true}
                  onClose={() => setShowMoreOptions(null)}
                  position={showMoreOptions}
                  options={[
                    {
                      id: 'favorite',
                      label: guide.is_purchased ? 'Remove from favorites' : 'Add to favorites',
                      icon: 'heart-outline',
                      onPress: async () => {
                        try {
                          await callRpc('toggle_audio_favorite', {
                            audioExperienceId: guide.id,
                          });
                          // Refresh audio guides
                          const result = await callRpc('get_audio_experiences', {
                            place_name: place.name,
                            latitude: (place as any).latitude,
                            longitude: (place as any).longitude,
                          });
                          if (result.success && result.audio_experiences) {
                            const guides: AudioGuide[] = result.audio_experiences.map((audio: any) => ({
                              id: audio.id,
                              title: audio.title,
                              duration: formatDuration(audio.duration_seconds || 0),
                              price: audio.price_coins === 0 ? 'Free' : `${audio.price_coins} coins`,
                              price_coins: audio.price_coins || 0,
                              isFree: audio.price_coins === 0,
                              is_purchased: audio.is_purchased || false,
                              audio_url: audio.audio_url,
                              description: audio.description,
                              language: audio.language || 'English',
                              avg_rating: audio.avg_rating,
                              rating_count: audio.rating_count || 0,
                            }));
                            setAudioGuides(guides);
                          }
                        } catch (error) {
                          console.error('Error toggling favorite:', error);
                        }
                      },
                    },
                    {
                      id: 'share',
                      label: 'Share',
                      icon: 'share-outline',
                      onPress: () => {
                        ShareService.shareQuest({
                          id: guide.id,
                          title: guide.title,
                          description: guide.description,
                        });
                      },
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
            ))
          )}
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
                <TouchableOpacity 
                  style={styles.engagementButton}
                  onPress={() => handleLikeMoment(moment.id)}
                >
                  <Ionicons 
                    name={likedMoments.has(moment.id) ? "heart" : "heart-outline"} 
                    size={18} 
                    color={likedMoments.has(moment.id) ? "#FF69B4" : "#666"} 
                  />
                  <Text style={[styles.engagementText, likedMoments.has(moment.id) && styles.engagementTextActive]}>
                    {moment.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.engagementButton}
                  onPress={() => {
                    // Navigate to comments or show comment modal
                    Alert.alert('Comments', `View comments for ${moment.userName}'s moment`);
                    // TODO: Implement comment viewing functionality
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#666" />
                  <Text style={styles.engagementText}>{moment.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.engagementButton}
                  onPress={() => handleShareMoment(moment)}
                >
                  <Ionicons name="share-outline" size={18} color="#666" />
                  <Text style={styles.engagementText}>Share</Text>
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

      {/* More Options Modal */}
      <Modal
        visible={showMoreOptions !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreOptions(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreOptions(null)}
        >
          <View style={styles.moreOptionsMenu}>
            {showMoreOptions && (() => {
              const guide = audioGuides.find(g => g.id === showMoreOptions.guideId);
              if (!guide) return null;
              
              return (
                <>
                  <TouchableOpacity
                    style={styles.moreOptionItem}
                    onPress={() => {
                      // Share audio guide
                      Alert.alert('Share', `Share "${guide.title}" with friends`);
                      setShowMoreOptions(null);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#333" />
                    <Text style={styles.moreOptionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.moreOptionItem}
                    onPress={() => {
                      // Add to favorites
                      Alert.alert('Added to Favorites', `"${guide.title}" added to your favorites`);
                      setShowMoreOptions(null);
                    }}
                  >
                    <Ionicons name="heart-outline" size={20} color="#333" />
                    <Text style={styles.moreOptionText}>Add to Favorites</Text>
                  </TouchableOpacity>
                  {guide.is_purchased && (
                    <TouchableOpacity
                      style={styles.moreOptionItem}
                      onPress={() => {
                        // Download for offline
                        Alert.alert('Download', `Downloading "${guide.title}" for offline use`);
                        setShowMoreOptions(null);
                      }}
                    >
                      <Ionicons name="download-outline" size={20} color="#333" />
                      <Text style={styles.moreOptionText}>Download for Offline</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.moreOptionItem}
                    onPress={() => {
                      // Report issue
                      Alert.alert('Report', `Report an issue with "${guide.title}"`);
                      setShowMoreOptions(null);
                    }}
                  >
                    <Ionicons name="flag-outline" size={20} color="#333" />
                    <Text style={styles.moreOptionText}>Report Issue</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
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
  engagementTextActive: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  purchaseButton: {
    backgroundColor: '#17B2B2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 12,
    color: '#FF9500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  moreOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  moreOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

