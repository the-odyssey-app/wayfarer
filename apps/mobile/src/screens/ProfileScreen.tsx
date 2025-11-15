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
import { FavoritePlacesScreen } from './FavoritePlacesScreen';
import { BadgesScreen } from './BadgesScreen';
import { PlaceDetailScreen } from './PlaceDetailScreen';
import { AccountInformationScreen } from './AccountInformationScreen';
import { SettingsScreen } from './SettingsScreen';
import { FriendsListScreen } from './FriendsListScreen';
import { MyPlacelistsScreen } from './MyPlacelistsScreen';
import { ActivityHistoryScreen } from './ActivityHistoryScreen';
import { PlacelistDetailScreen } from './PlacelistDetailScreen';

interface ProfileScreenProps {
  userId: string;
  username: string;
  onClose?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId,
  username,
  onClose,
}) => {
  const { callRpc } = useNakama();
  const [profileData, setProfileData] = useState({
    name: 'Sarah Wilson',
    username: '@sarahexplorer',
    xpPoints: 2456,
    regionalRank: 12,
    placesCount: 147,
  });
  const [showFavoritePlaces, setShowFavoritePlaces] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showPlacelists, setShowPlacelists] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [selectedPlacelist, setSelectedPlacelist] = useState<any>(null);
  const [purchasedAudio, setPurchasedAudio] = useState<any[]>([]);
  const [loadingAudio, setLoadingAudio] = useState(false);

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Mock data for places visited and quests completed in last 7 days
  // In production, this would come from backend RPC calls
  const [recentActivities, setRecentActivities] = useState([
    {
      id: '1',
      type: 'place',
      name: 'Pike Place Market',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: 'location',
      iconColor: '#FFD700',
      liked: false,
    },
    {
      id: '2',
      type: 'quest',
      name: 'Seattle Waterfront Explorer',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      icon: 'trophy',
      iconColor: '#17B2B2',
      xpReward: 150,
      liked: false,
    },
    {
      id: '3',
      type: 'place',
      name: 'Space Needle',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: 'business',
      iconColor: '#34C759',
      liked: true,
    },
    {
      id: '4',
      type: 'quest',
      name: 'Historic Downtown Tour',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: 'star',
      iconColor: '#FF9500',
      xpReward: 200,
      liked: false,
    },
    {
      id: '5',
      type: 'place',
      name: 'Chihuly Garden and Glass',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      icon: 'image',
      iconColor: '#AF52DE',
      liked: false,
    },
    {
      id: '6',
      type: 'quest',
      name: 'Market Food Adventure',
      time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      icon: 'restaurant',
      iconColor: '#FF69B4',
      xpReward: 175,
      liked: true,
    },
  ]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time for display
  const formatActivityTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (diffMins < 60) {
      return `Just now • ${timeStr}`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago • ${timeStr}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${timeStr}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago • ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Filter activities to last 7 days and sort by most recent
  const filteredActivities = recentActivities
    .filter((activity) => activity.time >= sevenDaysAgo)
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  const recentBadges = [
    { id: '1', name: 'Explorer', icon: 'mountain', color: '#17B2B2' },
    { id: '2', name: 'Photographer', icon: 'camera', color: '#FF9500' },
    { id: '3', name: 'Top Rated', icon: 'star', color: '#FF69B4' },
  ];

  const favoritePlaces = [
    {
      id: '1',
      name: 'Space Needle',
      image: 'seattle space needle at sunset, architectural photography',
    },
    {
      id: '2',
      name: 'Pike Place',
      image: 'pike place market entrance, seattle, street photography',
    },
  ];

  const friends = [
    { id: '1', name: 'Mike R.', avatar: '👤' },
    { id: '2', name: 'Emma S.', avatar: '👤' },
    { id: '3', name: 'John D.', avatar: '👤' },
    { id: '4', name: 'Lisa M.', avatar: '👤' },
  ];

  const placelists = [
    {
      id: '1',
      name: 'Best Food Spots',
      count: 12,
      icon: 'restaurant',
      color: '#FF69B4',
    },
    {
      id: '2',
      name: 'Photo Spots',
      count: 8,
      icon: 'camera',
      color: '#17B2B2',
    },
    {
      id: '3',
      name: 'Nature Walks',
      count: 5,
      icon: 'leaf',
      color: '#34C759',
    },
  ];

  // Fetch purchased audio collection
  useEffect(() => {
    const fetchAudioCollection = async () => {
      try {
        setLoadingAudio(true);
        const result = await callRpc('get_user_audio_collection', {});
        
        if (result.success && result.audio_experiences) {
          setPurchasedAudio(result.audio_experiences || []);
        } else {
          setPurchasedAudio([]);
        }
      } catch (error) {
        console.error('Error fetching audio collection:', error);
        setPurchasedAudio([]);
      } finally {
        setLoadingAudio(false);
      }
    };

    fetchAudioCollection();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Ionicons name="person" size={40} color="#17B2B2" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileUsername}>{profileData.username}</Text>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAccountInfo(true)}
            >
              <Ionicons name="create-outline" size={20} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.xpPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{profileData.regionalRank}</Text>
            <Text style={styles.statLabel}>Regional</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.placesCount}</Text>
            <Text style={styles.statLabel}>Places</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setShowActivityHistory(true)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activity in the last 7 days</Text>
            </View>
          ) : (
            filteredActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => {
                  if (activity.type === 'place') {
                    setSelectedPlace({ id: activity.id, name: activity.name });
                  }
                }}
              >
                <View style={[styles.activityIcon, { backgroundColor: activity.iconColor }]}>
                  <Ionicons name={activity.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.activityInfo}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    {activity.type === 'quest' && activity.xpReward && (
                      <View style={styles.xpBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.xpText}>+{activity.xpReward} XP</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityType}>
                      {activity.type === 'place' ? 'Place visited' : 'Quest completed'}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatActivityTime(activity.time)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    // Toggle like status
                    setRecentActivities(prev => prev.map(a => 
                      a.id === activity.id ? { ...a, liked: !a.liked } : a
                    ));
                    // TODO: Call API to update like status when RPC is available
                    try {
                      // await callRpc('like_activity', { activityId: activity.id });
                    } catch (error) {
                      console.error('Error liking activity:', error);
                    }
                  }}
                >
                  <Ionicons
                    name={activity.liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={activity.liked ? '#FF69B4' : '#999'}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <TouchableOpacity onPress={() => setShowBadges(true)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesContainer}>
            {recentBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                  <Ionicons name={badge.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Favorite Places */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Places</Text>
            <TouchableOpacity onPress={() => setShowFavoritePlaces(true)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.placesContainer}>
            {favoritePlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => setSelectedPlace(place)}
              >
                <View style={styles.placeImagePlaceholder}>
                  <Text style={styles.placeImageText}>{place.image}</Text>
                </View>
                <Text style={styles.placeName}>{place.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Friends */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity onPress={() => setShowFriendsList(true)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.friendsContainer}>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                </View>
                <Text style={styles.friendName}>{friend.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* My Audio Collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Audio Collection</Text>
          </View>
          {loadingAudio ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#17B2B2" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : purchasedAudio.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No purchased audio guides yet</Text>
            </View>
          ) : (
            purchasedAudio.map((audio) => (
              <TouchableOpacity key={audio.id} style={styles.audioCard}>
                <View style={styles.audioIcon}>
                  <Ionicons name="headset" size={24} color="#17B2B2" />
                </View>
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>{audio.title}</Text>
                  <Text style={styles.audioMeta}>
                    {audio.place_name || 'Location'} • {formatDuration(audio.duration_seconds || 0)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Placelists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Placelists</Text>
            <TouchableOpacity onPress={() => setShowPlacelists(true)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {placelists.map((list) => (
            <TouchableOpacity 
              key={list.id} 
              style={styles.placelistCard}
              onPress={() => {
                setSelectedPlacelist({
                  id: list.id,
                  name: list.name,
                  icon: list.icon,
                  color: list.color,
                  count: list.count,
                  privacy: 'private' as const,
                });
              }}
            >
              <View style={[styles.placelistIcon, { backgroundColor: list.color }]}>
                <Ionicons name={list.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.placelistInfo}>
                <Text style={styles.placelistName}>{list.name}</Text>
                <Text style={styles.placelistCount}>{list.count} places</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Favorite Places Modal */}
      <Modal
        visible={showFavoritePlaces}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFavoritePlaces(false)}
      >
        <FavoritePlacesScreen onClose={() => setShowFavoritePlaces(false)} />
      </Modal>

      {/* Badges Modal */}
      <Modal
        visible={showBadges}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowBadges(false)}
      >
        <BadgesScreen onClose={() => setShowBadges(false)} />
      </Modal>

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

      {/* Account Information Modal */}
      <Modal
        visible={showAccountInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountInfo(false)}
      >
        <AccountInformationScreen
          userId={userId}
          username={username}
          onClose={() => setShowAccountInfo(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>

      {/* Friends List Modal */}
      <Modal
        visible={showFriendsList}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFriendsList(false)}
      >
        <FriendsListScreen onClose={() => setShowFriendsList(false)} />
      </Modal>

      {/* My Placelists Modal */}
      <Modal
        visible={showPlacelists}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPlacelists(false)}
      >
        <MyPlacelistsScreen onClose={() => setShowPlacelists(false)} />
      </Modal>

      {/* Activity History Modal */}
      <Modal
        visible={showActivityHistory}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowActivityHistory(false)}
      >
        <ActivityHistoryScreen onClose={() => setShowActivityHistory(false)} />
      </Modal>

      {/* Placelist Detail Modal */}
      {selectedPlacelist && (
        <Modal
          visible={!!selectedPlacelist}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedPlacelist(null)}
        >
          <PlacelistDetailScreen
            placelist={selectedPlacelist}
            onClose={() => setSelectedPlacelist(null)}
          />
        </Modal>
      )}
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
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  profilePictureContainer: {
    marginRight: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#17B2B2',
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#666',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#17B2B2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#17B2B2',
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityType: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  placesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  placeCard: {
    flex: 1,
  },
  placeImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  placeImageText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  friendsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  friendItem: {
    alignItems: 'center',
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendAvatarText: {
    fontSize: 24,
  },
  friendName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  placelistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  placelistIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placelistInfo: {
    flex: 1,
  },
  placelistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  placelistCount: {
    fontSize: 12,
    color: '#666',
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
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioMeta: {
    fontSize: 12,
    color: '#666',
  },
});

