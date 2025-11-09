import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface PartyMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  level?: number;
  role: string;
  joined_at: string;
}

interface Party {
  id: string;
  name: string;
  leader_id: string;
  quest_id?: string;
  max_members: number;
  current_members: number;
  status: string;
}

interface PartyScreenProps {
  questId?: string;
  onClose?: () => void;
  onPartyJoined?: (partyId: string) => void;
}

export const PartyScreen: React.FC<PartyScreenProps> = ({
  questId,
  onClose,
  onPartyJoined,
}) => {
  const { callRpc, isConnected } = useNakama();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [partyCode, setPartyCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeVotes, setActiveVotes] = useState<any[]>([]);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    loadParty();
  }, [questId]);

  const loadParty = async () => {
    try {
      setLoading(true);
      // Try to get user's current party (if they're in one for this quest)
      if (questId) {
        // For now, we'll create or join - this could be enhanced to check existing party
        // For MVP, we'll just show create/join options
      }
    } catch (error) {
      console.error('Error loading party:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateParty = async () => {
    if (!questId) {
      Alert.alert('Error', 'No quest selected');
      return;
    }

    try {
      setCreating(true);
      const result = await callRpc('create_party', {
        questId: questId,
        maxMembers: 4,
      });

      if (result.success) {
        setParty({
          id: result.partyId,
          name: `Party for Quest`,
          leader_id: '',
          quest_id: questId,
          max_members: 4,
          current_members: 1,
          status: 'open',
        });
        setShowCreateModal(false);
        await loadPartyMembers(result.partyId);
        if (onPartyJoined) {
          onPartyJoined(result.partyId);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      Alert.alert('Error', 'Failed to create party');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinParty = async () => {
    if (!partyCode.trim()) {
      Alert.alert('Error', 'Please enter a party code');
      return;
    }

    try {
      setJoining(true);
      const result = await callRpc('join_party', {
        partyId: partyCode.trim(),
      });

      if (result.success) {
        setShowJoinModal(false);
        setPartyCode('');
        await loadParty();
        if (onPartyJoined) {
          onPartyJoined(partyCode.trim());
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to join party');
      }
    } catch (error) {
      console.error('Error joining party:', error);
      Alert.alert('Error', 'Failed to join party');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveParty = async () => {
    if (!party) {
      return;
    }

    Alert.alert(
      'Leave Party',
      'Are you sure you want to leave this party?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await callRpc('leave_party', {
                partyId: party.id,
              });

              if (result.success) {
                setParty(null);
                setMembers([]);
                await loadParty();
              } else {
                Alert.alert('Error', result.error || 'Failed to leave party');
              }
            } catch (error) {
              console.error('Error leaving party:', error);
              Alert.alert('Error', 'Failed to leave party');
            }
          },
        },
      ]
    );
  };

  const loadPartyMembers = async (partyId: string) => {
    try {
      const result = await callRpc('get_party_members', {
        partyId: partyId,
      });

      if (result.success) {
        setMembers(result.members || []);
        if (result.party) {
          setParty(result.party);
        }
        // Check if current user is leader
        const currentUser = result.members?.find((m: PartyMember) => m.role === 'leader');
        setIsLeader(currentUser !== undefined);
        // Load votes, subgroups, and progress
        await loadPartyData(partyId);
      }
    } catch (error) {
      console.error('Error loading party members:', error);
    }
  };

  const loadPartyData = async (partyId: string) => {
    try {
      // Load active votes
      const votesResult = await callRpc('get_party_votes', { partyId });
      if (votesResult.success) {
        setActiveVotes(votesResult.votes || []);
      }
      // Load subgroups
      const subgroupsResult = await callRpc('get_subgroups', { partyId });
      if (subgroupsResult.success) {
        setSubgroups(subgroupsResult.subgroups || []);
      }
    } catch (error) {
      console.error('Error loading party data:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (party) {
      loadPartyMembers(party.id);
    } else {
      loadParty();
    }
  };

  const handleViewVote = async (voteId: string) => {
    try {
      const result = await callRpc('get_vote_results', { voteId });
      if (result.success) {
        Alert.alert(
          result.vote.title,
          result.results.map((r: any) => `${r.label}: ${r.count} votes`).join('\n'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error viewing vote:', error);
    }
  };

  const handleCreateSubgroups = async () => {
    if (!party) return;
    Alert.alert(
      'Create Subgroups',
      'Split party into teams?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '2 Teams',
          onPress: async () => {
            try {
              const result = await callRpc('create_subgroups', { partyId: party.id, subgroupCount: 2 });
              if (result.success) {
                Alert.alert('Success', 'Subgroups created!');
                await loadPartyData(party.id);
              } else {
                Alert.alert('Error', result.error || 'Failed to create subgroups');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create subgroups');
            }
          },
        },
        {
          text: '3 Teams',
          onPress: async () => {
            try {
              const result = await callRpc('create_subgroups', { partyId: party.id, subgroupCount: 3 });
              if (result.success) {
                Alert.alert('Success', 'Subgroups created!');
                await loadPartyData(party.id);
              } else {
                Alert.alert('Error', result.error || 'Failed to create subgroups');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create subgroups');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: PartyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.username}</Text>
          {item.role === 'leader' && (
            <View style={styles.leaderBadge}>
              <Text style={styles.leaderBadgeText}>👑 Leader</Text>
            </View>
          )}
        </View>
        {item.level && (
          <Text style={styles.memberLevel}>Level {item.level}</Text>
        )}
      </View>
      {item.role === 'leader' && (
        <View style={styles.crownIcon}>
          <Text>👑</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading party...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>Party</Text>

      {party ? (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Party Info */}
          <View style={styles.partyInfoCard}>
            <View style={styles.partyHeader}>
              <Text style={styles.partyName}>{party.name}</Text>
              <Text style={styles.partyStatus}>{party.status}</Text>
            </View>
            <Text style={styles.partyMembers}>
              {party.current_members} / {party.max_members} members
            </Text>
            <Text style={styles.partyId}>Party ID: {party.id.substring(0, 8)}...</Text>
          </View>

          {/* Members List */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Members</Text>
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No members yet</Text>
                </View>
              }
            />
          </View>

          {/* Active Votes */}
          {activeVotes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Votes</Text>
              {activeVotes.map((vote) => (
                <TouchableOpacity
                  key={vote.id}
                  style={styles.voteCard}
                  onPress={() => handleViewVote(vote.id)}
                >
                  <Text style={styles.voteTitle}>{vote.title}</Text>
                  <Text style={styles.voteMeta}>By {vote.created_by_username}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Subgroups */}
          {subgroups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teams</Text>
              {subgroups.map((sg) => (
                <View key={sg.id} style={styles.subgroupCard}>
                  <Text style={styles.subgroupName}>{sg.name}</Text>
                  <Text style={styles.subgroupMembers}>{sg.member_count} members</Text>
                  {sg.members && sg.members.length > 0 && (
                    <View style={styles.subgroupMemberList}>
                      {sg.members.map((m: any) => (
                        <Text key={m.user_id} style={styles.subgroupMemberName}>{m.username}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {isLeader && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowVoteModal(true)}
                >
                  <Text style={styles.actionButtonText}>📊 Create Vote</Text>
                </TouchableOpacity>
                {members.length >= 4 && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCreateSubgroups()}
                  >
                    <Text style={styles.actionButtonText}>👥 Split into Teams</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveParty}
            >
              <Text style={styles.leaveButtonText}>Leave Party</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Party Yet</Text>
          <Text style={styles.emptyStateText}>
            {questId
              ? 'Create or join a party to tackle this quest together!'
              : 'Create or join a party to start a group quest!'}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
              disabled={!questId}
            >
              <Text style={styles.createButtonText}>Create Party</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => setShowJoinModal(true)}
            >
              <Text style={styles.joinButtonText}>Join Party</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Create Party Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Party</Text>
            <Text style={styles.modalDescription}>
              Create a party for this quest. Other players can join using the party code.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleCreateParty}
                disabled={creating || !questId}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Party Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Party</Text>
            <Text style={styles.modalDescription}>
              Enter the party code to join an existing party.
            </Text>
            <TextInput
              style={styles.partyCodeInput}
              placeholder="Enter party code"
              placeholderTextColor="#999"
              value={partyCode}
              onChangeText={setPartyCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setPartyCode('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleJoinParty}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  partyInfoCard: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  partyStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  partyMembers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  partyId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  membersSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 200,
  },
  voteCard: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  voteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  voteMeta: {
    fontSize: 12,
    color: '#666',
  },
  subgroupCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subgroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subgroupMembers: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  subgroupMemberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subgroupMemberName: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e0f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  leaderBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  leaderBadgeText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  memberLevel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  crownIcon: {
    marginLeft: 8,
  },
  actionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  partyCodeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    backgroundColor: '#007AFF',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

