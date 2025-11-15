import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FriendsListScreenProps {
  onClose?: () => void;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFriends?: number;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export const FriendsListScreen: React.FC<FriendsListScreenProps> = ({
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', name: 'Emma Davis', username: '@emmad', avatar: '👤', mutualFriends: 12 },
    { id: '2', name: 'Alex Thompson', username: '@alext', avatar: '👤', mutualFriends: 8 },
    { id: '3', name: 'Sophie Chen', username: '@sophiec', avatar: '👤', mutualFriends: 15 },
    { id: '4', name: 'Mike R.', username: '@miker', avatar: '👤', mutualFriends: 5 },
    { id: '5', name: 'John D.', username: '@johnd', avatar: '👤', mutualFriends: 10 },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: '1', name: 'Mike Johnson', username: '@mikej', avatar: '👤' },
  ]);

  const filteredFriends = friends.filter((friend) => {
    const query = searchQuery.toLowerCase();
    return (
      friend.name.toLowerCase().includes(query) ||
      friend.username.toLowerCase().includes(query)
    );
  });

  const handleAcceptRequest = (requestId: string) => {
    const request = friendRequests.find((r) => r.id === requestId);
    if (request && friends.length < 50) {
      setFriends([...friends, { ...request, mutualFriends: 0 }]);
      setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
      Alert.alert('Success', 'Friend request accepted');
    } else if (friends.length >= 50) {
      Alert.alert('Limit Reached', 'You have reached the maximum of 50 friends');
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
    Alert.alert('Request Declined', 'Friend request has been declined');
  };

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFriends(friends.filter((f) => f.id !== friendId));
            Alert.alert('Success', 'Friend removed');
          },
        },
      ]
    );
  };

  const handleAddFriend = () => {
    Alert.alert('Add Friend', 'Search for friends by username or email');
    // Implement add friend functionality
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>{friends.length} connections</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
          <Ionicons name="person-add" size={24} color="#17B2B2" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend Requests</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friendRequests.length}</Text>
              </View>
            </View>
            {friendRequests.map((request) => (
              <View key={request.id} style={styles.friendCard}>
                <View style={styles.friendLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{request.avatar}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{request.name}</Text>
                    <Text style={styles.friendUsername}>{request.username}</Text>
                  </View>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Friends List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends ({filteredFriends.length})</Text>
          {filteredFriends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </Text>
            </View>
          ) : (
            filteredFriends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendUsername}>{friend.username}</Text>
                    {friend.mutualFriends !== undefined && (
                      <Text style={styles.mutualFriends}>
                        {friend.mutualFriends} mutual friends
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => handleRemoveFriend(friend.id)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Friend Limit Warning */}
        {friends.length >= 50 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.warningText}>
              You have reached the maximum of 50 friends
            </Text>
          </View>
        )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 24,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 12,
    color: '#999',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    flex: 1,
  },
});

