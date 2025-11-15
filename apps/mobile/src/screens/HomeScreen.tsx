import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNakama } from '../contexts/NakamaContext';
import { NavigationService } from '../services/NavigationService';
import { ShareService } from '../services/ShareService';
import { MapComponent } from '../components/MapComponent';
import { QuestDetailScreen } from './QuestDetailScreen';
import { QuestListScreen } from './QuestListScreen';
import { QuestCard } from '../components/QuestCard';
import { NavigationCard } from '../components/NavigationCard';
import { TopNavigationCard } from '../components/TopNavigationCard';
import { WaitingNotification } from '../components/WaitingNotification';
import { LeaderboardScreen } from './LeaderboardScreen';
import { InventoryScreen } from './InventoryScreen';
import { PlacesScreen } from './PlacesScreen';
import { AchievementsScreen } from './AchievementsScreen';
import { ProfileScreen } from './ProfileScreen';
import { PlaceDetailScreen } from './PlaceDetailScreen';
import { QuestSubmissionScreen } from './QuestSubmissionScreen';
import { QuestCompleteScreen } from './QuestCompleteScreen';
import { UpcomingAdventuresScreen } from './UpcomingAdventuresScreen';
import { GroupQuestScreen } from './GroupQuestScreen';
import { CreatePrivateQuestScreen } from './CreatePrivateQuestScreen';
import { ChooseQuestTypeScreen } from './ChooseQuestTypeScreen';
import { CreatingQuestScreen } from './CreatingQuestScreen';
import { QuestCreatedScreen } from './QuestCreatedScreen';
import { HistoryScreen } from './HistoryScreen';
import { CalendarScreen } from './CalendarScreen';
import { ActivityHistoryScreen } from './ActivityHistoryScreen';
import { FilterModal } from '../components/FilterModal';

interface HomeScreenProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userId,
  username,
  onLogout,
}) => {
  const { session, isConnected, disconnect, callRpc } = useNakama();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showQuestList, setShowQuestList] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [eventQuests, setEventQuests] = useState<any[]>([]);
  const [showEventQuests, setShowEventQuests] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toggleOn, setToggleOn] = useState(true);
  const [userLevel, setUserLevel] = useState(15);
  const [showMiscMenu, setShowMiscMenu] = useState(false);
  const [showUpcomingAdventures, setShowUpcomingAdventures] = useState(false);
  const [showGroupQuest, setShowGroupQuest] = useState(false);
  const [selectedPrivateQuest, setSelectedPrivateQuest] = useState<any | null>(null);
  const [showOrganizeQuest, setShowOrganizeQuest] = useState(false);
  const [showCreatePrivateQuest, setShowCreatePrivateQuest] = useState(false);
  const [showChooseQuestType, setShowChooseQuestType] = useState(false);
  const [showCreatingQuest, setShowCreatingQuest] = useState(false);
  const [showQuestCreated, setShowQuestCreated] = useState(false);
  const [selectedQuestType, setSelectedQuestType] = useState<'mystery' | 'scavenger_hunt' | 'with_friends' | null>(null);
  const [isGroupQuest, setIsGroupQuest] = useState(false);
  const [createdQuestData, setCreatedQuestData] = useState<{ questId: string; joinCode: string; questTitle: string } | null>(null);
  const [totalParticipants, setTotalParticipants] = useState('9');
  const [questParticipants, setQuestParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const locationMonitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const currentDestination = useRef<{ latitude: number; longitude: number } | null>(null);
  const [numberOfGroups, setNumberOfGroups] = useState(3);
  const [mapZoom, setMapZoom] = useState(15);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [publicQuests, setPublicQuests] = useState<any[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<any | null>(null);
  const [showQuestCard, setShowQuestCard] = useState(false);
  const [joinedQuest, setJoinedQuest] = useState<any | null>(null);
  const [isWaitingForQuest, setIsWaitingForQuest] = useState(false);
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [questProgress, setQuestProgress] = useState({ currentStep: 1, totalSteps: 10 });
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [navigationData, setNavigationData] = useState({
    destination: 'String value',
    distance: '400 ft',
    walkTime: '3 min walk',
    route: 'Pike Street',
  });
  const [nextStop, setNextStop] = useState({
    name: 'String value',
    distance: '400 ft',
    walkTime: '1 min walk',
  });
  const [showQuestSubmission, setShowQuestSubmission] = useState(false);
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const [completedQuestData, setCompletedQuestData] = useState<any | null>(null);
  const [questFilter, setQuestFilter] = useState<'starting_soon' | 'nearby' | 'duration' | 'items' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleLogout = async () => {
    try {
      await disconnect();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLocationUpdate = async (latitude: number, longitude: number) => {
    setCurrentLocation({ lat: latitude, lng: longitude });
    
    // Call Nakama RPC to update user location
    try {
      const result = await callRpc('update_user_location', {
        latitude,
        longitude
      });
    } catch (error) {
      console.error('Error calling update_user_location RPC:', error);
    }
  };

  const handleQuestSelect = (questId: string) => {
    setSelectedQuestId(questId);
  };

  const handleQuestMarkerSelect = (quest: any) => {
    setSelectedQuest(quest);
    setShowQuestCard(true);
  };

  const handleJoinQuest = async () => {
    if (selectedQuest) {
      try {
        // Call RPC to join the quest
        const result = await callRpc('start_quest', {
          quest_id: selectedQuest.id,
        });

        if (result.success) {
          setJoinedQuest(selectedQuest);
          setIsWaitingForQuest(true);
          setShowQuestCard(false);
          setSelectedQuest(null);

          // Check if quest has already started
          if (selectedQuest.start_time) {
            const startTime = new Date(selectedQuest.start_time);
            const now = new Date();
            if (startTime.getTime() <= now.getTime()) {
              // Quest has already started, activate navigation
              setIsQuestActive(true);
              setIsWaitingForQuest(false);
            } else {
              // Wait for quest to start
              const timeUntilStart = startTime.getTime() - now.getTime();
              setTimeout(() => {
                setIsQuestActive(true);
                setIsWaitingForQuest(false);
              }, timeUntilStart);
            }
          } else {
            // No start time, assume it starts immediately
            setIsQuestActive(true);
            setIsWaitingForQuest(false);
          }
        }
      } catch (error) {
        console.error('Error joining quest:', error);
        Alert.alert('Error', 'Failed to join quest. Please try again.');
      }
    }
  };

  const handleDismissWaiting = () => {
    setIsWaitingForQuest(false);
    setJoinedQuest(null);
  };

  const handleNavigate = async () => {
    if (!currentLocation || !joinedQuest) {
      Alert.alert('Error', 'Location or quest information not available');
      return;
    }

    try {
      // Get current quest step details
      const questDetail = await callRpc('get_quest_detail', { 
        questId: joinedQuest.id 
      });

      if (!questDetail.success || !questDetail.quest) {
        Alert.alert('Error', 'Could not load quest steps');
        return;
      }

      const currentStep = questDetail.quest.steps?.find(
        (step: any) => step.step_number === questProgress.currentStep
      );

      if (!currentStep || !currentStep.latitude || !currentStep.longitude) {
        Alert.alert('Error', 'Current step location not found');
        return;
      }

      // Calculate route using NavigationService
      const route = await NavigationService.getRoute(
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: currentStep.latitude, longitude: currentStep.longitude },
        'walking'
      );

      if (!route) {
        Alert.alert('Error', 'Could not calculate route');
        return;
      }

      // Update navigation state
    setIsNavigating(true);
    setHasArrived(false);
      
      // Store destination for arrival detection
      currentDestination.current = {
        latitude: currentStep.latitude,
        longitude: currentStep.longitude,
      };
      
      // Update navigation data
      setNavigationData({
        destination: currentStep.place_name || currentStep.description || 'Destination',
        distance: NavigationService.formatDistance(route.distance),
        walkTime: NavigationService.formatDuration(route.duration),
        route: route.steps[0]?.maneuver?.instruction || 'Route',
      });

      setNextStop({
        name: currentStep.place_name || 'Next Stop',
        distance: NavigationService.formatDistance(route.distance),
        walkTime: NavigationService.formatDuration(route.duration),
      });

      // Set route coordinates for map display
      setRouteCoordinates(route.geometry.coordinates as [number, number][]);

      // Start location monitoring
      startLocationMonitoring();
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to start navigation');
    }
  };

  const startLocationMonitoring = () => {
    // Clear any existing interval
    if (locationMonitoringInterval.current) {
      clearInterval(locationMonitoringInterval.current);
    }

    // Check location every 5 seconds
    locationMonitoringInterval.current = setInterval(async () => {
      try {
        const currentPos = await Location.getCurrentPositionAsync({});
        await handleLocationUpdate(currentPos.coords.latitude, currentPos.coords.longitude);
      } catch (error) {
        console.error('Location monitoring error:', error);
      }
    }, 5000);
  };

  const handleEndRoute = () => {
    Alert.alert(
      'End Route',
      'Are you sure you want to end navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Route',
          style: 'destructive',
          onPress: () => {
            setIsNavigating(false);
            setHasArrived(false);
            // Clear route from map
            setRouteCoordinates([]);
            currentDestination.current = null;
            // Stop location monitoring
            if (locationMonitoringInterval.current) {
              clearInterval(locationMonitoringInterval.current);
              locationMonitoringInterval.current = null;
            }
          },
        },
      ]
    );
  };

  const handleCompleteTask = () => {
    // Show quest submission screen
    setShowQuestSubmission(true);
  };

  const handleQuestSubmission = async (submission: { photoUri?: string; text?: string }) => {
    try {
      // First, get quest detail to obtain step IDs
      const questDetail = await callRpc('get_quest_detail', { questId: joinedQuest?.id });
      
      if (!questDetail.success || !questDetail.steps || questDetail.steps.length === 0) {
        Alert.alert('Error', 'Could not load quest steps');
        return;
      }

      // Find the current step by step number
      const currentStepObj = questDetail.steps.find(
        (step: any) => step.step_number === questProgress.currentStep
      );

      if (!currentStepObj) {
        Alert.alert('Error', 'Current step not found');
        return;
      }

      // Submit media if provided
      if (submission.photoUri || submission.text) {
        try {
          await callRpc('submit_step_media', {
            questId: joinedQuest?.id,
            stepId: currentStepObj.id,
            mediaType: submission.photoUri ? 'photo' : 'text',
            mediaUrl: submission.photoUri || null,
            textContent: submission.text || null,
          });
        } catch (e) {
          console.log('Media submission failed, continuing with step completion');
        }
      }

      // Complete the step with location verification
      const result = await callRpc('complete_step', {
        questId: joinedQuest?.id,
        stepId: currentStepObj.id,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
      });

      if (result.success) {
        setShowQuestSubmission(false);
        
        // Check if quest was completed (all steps done)
        if (result.questCompleted) {
          // Quest completed - call complete_quest to finalize and get rewards
          try {
            const completeResult = await callRpc('complete_quest', { quest_id: joinedQuest?.id });
            if (completeResult.success) {
              setCompletedQuestData({
                questTitle: joinedQuest?.title || 'Quest',
                xpReward: completeResult.xp_reward || completeResult.total_xp || 100,
                title: joinedQuest?.title || 'Quest',
                xpEarned: completeResult.xp_reward || completeResult.total_xp || 100,
                bonusPoints: 0,
              });
              setShowQuestComplete(true);
            }
          } catch (e) {
            console.error('Error completing quest:', e);
            // Still show completion screen even if finalization fails
            setCompletedQuestData({
              questTitle: joinedQuest?.title || 'Quest',
              xpReward: joinedQuest?.reward_xp || 100,
              title: joinedQuest?.title || 'Quest',
              xpEarned: joinedQuest?.reward_xp || 100,
              bonusPoints: 0,
            });
            setShowQuestComplete(true);
          }
        } else {
          // Update progress for next step
          if (result.currentStep && result.totalSteps) {
            setQuestProgress({
              currentStep: result.currentStep,
              totalSteps: result.totalSteps,
            });
          } else if (questProgress.currentStep < questProgress.totalSteps) {
          setQuestProgress({
            currentStep: questProgress.currentStep + 1,
            totalSteps: questProgress.totalSteps,
          });
          }
          setHasArrived(false);
          setIsNavigating(false);
          // Clear route for current step
          setRouteCoordinates([]);
          currentDestination.current = null;
          // Stop location monitoring
          if (locationMonitoringInterval.current) {
            clearInterval(locationMonitoringInterval.current);
            locationMonitoringInterval.current = null;
          }
          // Start navigation to next step if available
          const nextStepNumber = result.currentStep || questProgress.currentStep + 1;
          if (nextStepNumber <= questProgress.totalSteps) {
            // Small delay to allow state to update, then start navigation
            setTimeout(() => {
              handleNavigate();
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting quest:', error);
      Alert.alert('Error', 'Failed to submit quest. Please try again.');
    }
  };

  const handleViewPlaceDetails = () => {
    if (joinedQuest) {
      setSelectedPlace({
        id: joinedQuest.id,
        name: joinedQuest.placeName || joinedQuest.title,
      });
    }
  };

  const handleShareAchievement = async () => {
    if (completedQuestData) {
      await ShareService.shareQuestCompletion({
        title: completedQuestData.questTitle || joinedQuest?.title || 'Quest',
        xpReward: completedQuestData.xpReward,
        completedAt: new Date().toISOString(),
      });
    } else {
      Alert.alert('Share', 'No achievement to share');
    }
  };

  const handleContinueExploring = () => {
    setShowQuestComplete(false);
    setIsQuestActive(false);
    setIsNavigating(false);
    setHasArrived(false);
    setJoinedQuest(null);
    setCompletedQuestData(null);
    // Refresh quest list
    fetchPublicQuests();
  };

  const fetchQuestParticipants = async (questId: string) => {
    try {
      setLoadingParticipants(true);
      const result = await callRpc('get_quest_participants', { quest_id: questId });
      
      if (result.success) {
        setQuestParticipants(result.participants || []);
        setTotalParticipants(result.count.toString());
      } else {
        console.error('Failed to fetch participants:', result.error);
        setQuestParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setQuestParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const fetchPublicQuests = async () => {
    try {
      const payload = currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            maxDistanceKm: 10,
          }
        : undefined;

      const result = await callRpc('get_available_quests', payload);
      
      if (result.success && result.quests) {
        // Filter for public quests that are starting soon
        const now = new Date();
        const soonQuests = result.quests.filter((quest: any) => {
          // Only show quests that are available or starting within next hour
          if (quest.start_time) {
            const startTime = new Date(quest.start_time);
            const timeUntilStart = startTime.getTime() - now.getTime();
            return timeUntilStart >= 0 && timeUntilStart <= 60 * 60 * 1000; // Within 1 hour
          }
          return quest.status === 'available' || quest.status === 'active';
        });
        setPublicQuests(soonQuests);
      }
    } catch (error) {
      console.error('Error fetching public quests:', error);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      fetchPublicQuests();
    }
  }, [currentLocation]);

  // Fetch participants when quest is selected
  useEffect(() => {
    if (selectedPrivateQuest?.id) {
      fetchQuestParticipants(selectedPrivateQuest.id);
    }
  }, [selectedPrivateQuest?.id]);

  // Cleanup location monitoring on unmount
  useEffect(() => {
    return () => {
      if (locationMonitoringInterval.current) {
        clearInterval(locationMonitoringInterval.current);
      }
    };
  }, []);

  // Auto-refresh quests every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPublicQuests();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [currentLocation]);

  const handleQuestAction = () => {
    // Refresh quest list when quest is started/completed
    setRefreshTrigger(prev => prev + 1);
    setSelectedQuestId(null);
  };

  const handleCloseQuestDetail = () => {
    setSelectedQuestId(null);
  };

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    try {
      const result = await callRpc('get_active_event', {});
      if (result.success && result.event) {
        setActiveEvent(result.event);
        setEventQuests(result.quests || []);
      } else {
        setActiveEvent(null);
        setEventQuests([]);
      }
    } catch (error) {
      console.error('Error loading active event:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
      <MapComponent 
        onLocationUpdate={handleLocationUpdate}
        onQuestSelect={handleQuestMarkerSelect}
        zoomLevel={mapZoom}
        selectedQuestId={selectedQuest?.id || null}
        routeCoordinates={routeCoordinates}
      />
      </View>

      {/* Quest Filters - Shown when toggle is on */}
      {toggleOn && (
        <View style={styles.questFiltersContainer}>
          <TouchableOpacity 
            style={[styles.questFilterButton, questFilter === 'starting_soon' && styles.questFilterButtonActive]}
            onPress={() => {
              if (questFilter === 'starting_soon') {
                setQuestFilter(null);
                setFilteredPublicQuests(publicQuests);
              } else {
                setQuestFilter('starting_soon');
                // Filter quests starting within next hour
                const now = new Date();
                const filtered = publicQuests.filter((quest: any) => {
                  if (quest.start_time) {
                    const startTime = new Date(quest.start_time);
                    const timeUntilStart = startTime.getTime() - now.getTime();
                    return timeUntilStart >= 0 && timeUntilStart <= 60 * 60 * 1000;
                  }
                  return false;
                });
                setFilteredPublicQuests(filtered);
              }
            }}
          >
            <MaterialIcons name="event-available" size={20} color={questFilter === 'starting_soon' ? "#17B2B2" : "#000"} />
            <Text style={[styles.questFilterText, questFilter === 'starting_soon' && styles.questFilterTextActive]}>Starting Soon</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.questFilterButton, questFilter === 'nearby' && styles.questFilterButtonActive]}
            onPress={() => {
              if (questFilter === 'nearby') {
                setQuestFilter(null);
                setFilteredPublicQuests(publicQuests);
              } else {
                setQuestFilter('nearby');
                // Filter quests within 2km
                if (currentLocation) {
                  const filtered = publicQuests.filter((quest: any) => {
                    if (quest.location_lat && quest.location_lng) {
                      // Simple distance calculation (Haversine would be better)
                      const latDiff = Math.abs(quest.location_lat - currentLocation.lat);
                      const lngDiff = Math.abs(quest.location_lng - currentLocation.lng);
                      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // rough km conversion
                      return distance <= 2;
                    }
                    return false;
                  });
                  setFilteredPublicQuests(filtered);
                } else {
                  setFilteredPublicQuests(publicQuests);
                }
              }
            }}
          >
            <Ionicons name="walk" size={20} color={questFilter === 'nearby' ? "#17B2B2" : "#000"} />
            <Text style={[styles.questFilterText, questFilter === 'nearby' && styles.questFilterTextActive]}>Near By</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.questFilterButton, questFilter === 'duration' && styles.questFilterButtonActive]}
            onPress={() => {
              if (questFilter === 'duration') {
                setQuestFilter(null);
                setFilteredPublicQuests(publicQuests);
              } else {
                setQuestFilter('duration');
                // Filter quests by duration (show shorter quests first)
                const sorted = [...publicQuests].sort((a: any, b: any) => {
                  const aDuration = a.estimated_time_minutes || 90;
                  const bDuration = b.estimated_time_minutes || 90;
                  return aDuration - bDuration;
                });
                setFilteredPublicQuests(sorted);
              }
            }}
          >
            <Ionicons name="time" size={20} color={questFilter === 'duration' ? "#17B2B2" : "#000"} />
            <Text style={[styles.questFilterText, questFilter === 'duration' && styles.questFilterTextActive]}>Duration</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.questFilterButton, questFilter === 'items' && styles.questFilterButtonActive]}
            onPress={() => {
              if (questFilter === 'items') {
                setQuestFilter(null);
                setFilteredPublicQuests(publicQuests);
              } else {
                setQuestFilter('items');
                // Filter quests that reward items
                const filtered = publicQuests.filter((quest: any) => {
                  return quest.item_rewards && quest.item_rewards.length > 0;
                });
                setFilteredPublicQuests(filtered);
              }
            }}
          >
            <Ionicons name="bag" size={20} color={questFilter === 'items' ? "#17B2B2" : "#000"} />
            <Text style={[styles.questFilterText, questFilter === 'items' && styles.questFilterTextActive]}>Items</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Right-Side Vertical Button Stack */}
      <View style={styles.rightButtonStack}>
        {/* Toggle Switch Button (Teal) */}
        <TouchableOpacity
          style={[styles.rightButton, toggleOn && styles.rightButtonActive]}
          onPress={() => setToggleOn(!toggleOn)}
        >
          <MaterialIcons 
            name={toggleOn ? "toggle-on" : "toggle-off"} 
            size={28} 
            color={toggleOn ? "#17B2B2" : "#666"} 
          />
        </TouchableOpacity>

        {/* Compass Button (Green) - Zoom In/Out */}
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => {
            if (isZoomedIn) {
              // Zoom out
              setMapZoom(15);
              setIsZoomedIn(false);
            } else {
              // Zoom in
              setMapZoom(18);
              setIsZoomedIn(true);
            }
          }}
        >
          <MaterialIcons 
            name={isZoomedIn ? "zoom-out" : "zoom-in"} 
            size={24} 
            color="#34C759" 
          />
        </TouchableOpacity>

        {/* History/Redo Button (Orange) */}
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => {
            setShowHistory(true);
          }}
        >
          <MaterialIcons name="history" size={24} color="#FF9500" />
        </TouchableOpacity>

        {/* Calendar Button (Brown) */}
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => {
            setShowCalendar(true);
          }}
        >
          <MaterialIcons name="event" size={24} color="#8B4513" />
        </TouchableOpacity>

        {/* Filter Button (Pink) */}
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => {
            setShowFilterModal(true);
          }}
        >
          <MaterialIcons name="filter-list" size={24} color="#FF69B4" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        {/* Left: Profile/Level Button (Pink elongated oval) */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowProfile(true)}
        >
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <Text style={styles.levelText}>Lvl {userLevel}</Text>
        </TouchableOpacity>

        {/* Middle: Shopping Bag Button (Circular green) */}
        <TouchableOpacity
          style={styles.shoppingBagButton}
          onPress={() => setShowInventory(true)}
        >
          <Ionicons name="bag" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Right: More Options Button (Circular teal-blue) */}
        <TouchableOpacity
          style={styles.moreOptionsButton}
          onPress={() => setShowMiscMenu(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quest Detail Modal */}
      {selectedQuestId && (
        <Modal
          visible={!!selectedQuestId}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseQuestDetail}
        >
          <QuestDetailScreen
            questId={selectedQuestId}
            onClose={handleCloseQuestDetail}
            onQuestStarted={handleQuestAction}
          />
        </Modal>
      )}

      {/* Quest List Modal */}
      <Modal
        visible={showQuestList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuestList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQuestList(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quests</Text>
          </View>
          <QuestListScreen
            onQuestSelect={(questId) => {
              setShowQuestList(false);
              setSelectedQuestId(questId);
            }}
            userLocation={currentLocation || undefined}
          />
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      </Modal>

      {/* Inventory Modal */}
      <Modal
        visible={showInventory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInventory(false)}
      >
        <InventoryScreen onClose={() => setShowInventory(false)} />
      </Modal>

      {/* Places Modal */}
      <Modal
        visible={showPlaces}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlaces(false)}
      >
        <PlacesScreen onClose={() => setShowPlaces(false)} userLocation={currentLocation || undefined} />
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievements}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAchievements(false)}
      >
        <AchievementsScreen onClose={() => setShowAchievements(false)} />
      </Modal>

      {/* Active Event Quests Modal */}
      <Modal
        visible={showEventQuests}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventQuests(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEventQuests(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{activeEvent?.title || 'Event Quests'}</Text>
          </View>
          <View style={{ padding: 20 }}>
            {eventQuests.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={{ padding: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 12 }}
                onPress={() => {
                  setShowEventQuests(false);
                  setSelectedQuestId(q.id);
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 }}>{q.title}</Text>
                <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={2}>{q.description}</Text>
              </TouchableOpacity>
            ))}
            {eventQuests.length === 0 && (
              <Text style={{ fontSize: 14, color: '#666' }}>No quests available for this event.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Misc Menu Modal */}
      <Modal
        visible={showMiscMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMiscMenu(false)}
      >
        <View style={styles.miscMenuOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowMiscMenu(false)}
          />
          <View style={styles.miscMenuContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.miscMenuCloseButton}
              onPress={() => setShowMiscMenu(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            {/* Menu Buttons Grid */}
            <View style={styles.miscMenuGrid}>
              {/* Top Row Left: Create a private quest */}
              <View style={styles.miscMenuButtonWrapper}>
                <TouchableOpacity
                  style={styles.miscMenuButton}
                  onPress={() => {
                    setShowMiscMenu(false);
                    setShowCreatePrivateQuest(true);
                  }}
                >
                  <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.miscMenuButtonLabel}>Create a private quest</Text>
              </View>

              {/* Top Row Right: Shop */}
              <View style={styles.miscMenuButtonWrapper}>
                <TouchableOpacity
                  style={styles.miscMenuButton}
                  onPress={() => {
                    setShowMiscMenu(false);
                    // TODO: Navigate to shop
                    Alert.alert('Shop', 'Feature coming soon');
                  }}
                >
                  <Ionicons name="bag" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.miscMenuButtonLabel}>Shop</Text>
              </View>

              {/* Bottom Row Center: Organize quest */}
              <View style={[styles.miscMenuButtonWrapper, styles.miscMenuButtonWrapperCenter]}>
                <TouchableOpacity
                  style={styles.miscMenuButton}
                  onPress={() => {
                    setShowMiscMenu(false);
                    setShowUpcomingAdventures(true);
                  }}
                >
                  <Ionicons name="list" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.miscMenuButtonLabel}>Organize quest</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upcoming Adventures Modal */}
      <Modal
        visible={showUpcomingAdventures}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpcomingAdventures(false)}
      >
        <UpcomingAdventuresScreen
          onClose={() => setShowUpcomingAdventures(false)}
          onQuestSelect={(quest) => {
            setSelectedPrivateQuest(quest);
            setShowUpcomingAdventures(false);
            setShowGroupQuest(true);
          }}
        />
      </Modal>

      {/* Group Quest Modal */}
      <Modal
        visible={showGroupQuest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowGroupQuest(false);
          setSelectedPrivateQuest(null);
        }}
      >
        {selectedPrivateQuest && (
          <GroupQuestScreen
            quest={selectedPrivateQuest}
            participants={questParticipants}
            onClose={() => {
              setShowGroupQuest(false);
              setSelectedPrivateQuest(null);
            }}
            onOrganize={() => {
              // Set total participants based on the quest
              if (selectedPrivateQuest && selectedPrivateQuest.participants) {
                setTotalParticipants(selectedPrivateQuest.participants.toString());
              }
              setShowGroupQuest(false);
              setShowOrganizeQuest(true);
            }}
          />
        )}
      </Modal>

      {/* Create Groups Modal */}
      <Modal
        visible={showOrganizeQuest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrganizeQuest(false)}
      >
        <View style={styles.organizeQuestContainer}>
          {/* Header */}
          <View style={styles.organizeQuestHeader}>
            <Text style={styles.organizeQuestTitle}>Create Groups</Text>
            <TouchableOpacity
              style={styles.organizeQuestCloseButton}
              onPress={() => setShowOrganizeQuest(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.organizeQuestContent}>
            {/* Total Participants Section */}
            <View style={styles.organizeQuestSection}>
              <Text style={styles.organizeQuestLabel}>Total Participants</Text>
              <View style={styles.organizeQuestInputContainer}>
                <TextInput
                  style={styles.organizeQuestInput}
                  value={totalParticipants}
                  onChangeText={setTotalParticipants}
                  keyboardType="numeric"
                  placeholder="Enter number"
                />
                <View style={styles.organizeQuestInputIcon}>
                  <Ionicons name="people" size={24} color="#17B2B2" />
                </View>
              </View>
            </View>

            {/* Number of Groups Section */}
            <View style={styles.organizeQuestSection}>
              <Text style={styles.organizeQuestLabel}>Number of Groups</Text>
              <View style={styles.organizeQuestGroupButtons}>
                {[2, 3, 4].map((num, index) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.organizeQuestGroupButton,
                      numberOfGroups === num && styles.organizeQuestGroupButtonActive,
                      index === 2 && styles.organizeQuestGroupButtonLast,
                    ]}
                    onPress={() => setNumberOfGroups(num)}
                  >
                    <Text
                      style={[
                        styles.organizeQuestGroupButtonText,
                        numberOfGroups === num && styles.organizeQuestGroupButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview Section */}
            <View style={styles.organizeQuestSection}>
              <Text style={styles.organizeQuestLabel}>Preview</Text>
              {(() => {
                const participants = parseInt(totalParticipants) || 0;
                const groups = numberOfGroups;
                const membersPerGroup = Math.floor(participants / groups);
                const remainder = participants % groups;
                const groupColors = ['#FF69B4', '#17B2B2', '#FF9500', '#9B59B6', '#34C759'];

                return Array.from({ length: groups }, (_, i) => {
                  const groupNum = i + 1;
                  const members = membersPerGroup + (i < remainder ? 1 : 0);
                  return (
                    <View key={groupNum} style={styles.organizeQuestPreviewCard}>
                      <View style={[styles.organizeQuestPreviewDot, { backgroundColor: groupColors[i % groupColors.length] }]} />
                      <Text style={styles.organizeQuestPreviewGroupName}>Group {groupNum}</Text>
                      <Text style={styles.organizeQuestPreviewMembers}>({members} members)</Text>
                    </View>
                  );
                });
              })()}
            </View>
          </ScrollView>

          {/* Create Groups Button */}
          <View style={styles.organizeQuestFooter}>
            <TouchableOpacity
              style={styles.organizeQuestCreateButton}
              onPress={async () => {
                try {
                  // First, check if there's a party for this quest
                  // If not, we may need to create one or use a different approach
                  // For now, we'll try to create subgroups with the quest participants
                  if (!selectedPrivateQuest?.id) {
                    Alert.alert('Error', 'No quest selected');
                    return;
                  }

                  // Get party ID from quest or create one
                  // Note: This assumes the quest has a party associated
                  // You may need to adjust this based on your data model
                  const partyResult = await callRpc('get_party_members', {
                    questId: selectedPrivateQuest.id,
                  });

                  let partyId = partyResult?.party_id;
                  
                  // If no party exists, we might need to create one first
                  // For now, we'll show an error if no party
                  if (!partyId) {
                    Alert.alert('Error', 'No party found for this quest. Please create a party first.');
                    return;
                  }

                  const result = await callRpc('create_subgroups', {
                    partyId: partyId,
                    subgroupCount: numberOfGroups,
                  });

                  if (result.success) {
                    Alert.alert('Success', `Created ${numberOfGroups} groups successfully!`);
                setShowOrganizeQuest(false);
                setSelectedPrivateQuest(null);
                  } else {
                    Alert.alert('Error', result.error || 'Failed to create groups');
                  }
                } catch (error: any) {
                  console.error('Error creating groups:', error);
                  Alert.alert('Error', error.message || 'Failed to create groups');
                }
              }}
            >
              <Text style={styles.organizeQuestCreateButtonText}>Create Groups</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfile(false)}
      >
        <ProfileScreen
          userId={userId}
          username={username}
          onClose={() => setShowProfile(false)}
        />
      </Modal>

      {/* Quest Complete Modal */}
      {showQuestComplete && completedQuestData && (
        <Modal
          visible={showQuestComplete}
          animationType="fade"
          transparent={true}
          onRequestClose={handleContinueExploring}
        >
          <QuestCompleteScreen
            quest={completedQuestData}
            onShare={handleShareAchievement}
            onContinue={handleContinueExploring}
          />
        </Modal>
      )}

      {/* Create Private Quest Modal */}
      <Modal
        visible={showCreatePrivateQuest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePrivateQuest(false)}
      >
        <CreatePrivateQuestScreen
          onClose={() => setShowCreatePrivateQuest(false)}
          onSelectSolo={() => {
            setIsGroupQuest(false);
            setShowCreatePrivateQuest(false);
            setShowChooseQuestType(true);
          }}
          onSelectWithFriends={() => {
            setIsGroupQuest(true);
            setShowCreatePrivateQuest(false);
            setShowChooseQuestType(true);
          }}
        />
      </Modal>

      {/* Choose Quest Type Modal */}
      <Modal
        visible={showChooseQuestType}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChooseQuestType(false)}
      >
        <ChooseQuestTypeScreen
          isGroupQuest={isGroupQuest}
          onClose={() => setShowChooseQuestType(false)}
          onSelectMystery={() => {
            setSelectedQuestType('mystery');
            setShowChooseQuestType(false);
            setShowCreatingQuest(true);
          }}
          onSelectScavengerHunt={() => {
            setSelectedQuestType('scavenger_hunt');
            setShowChooseQuestType(false);
            setShowCreatingQuest(true);
          }}
        />
      </Modal>

      {/* Creating Quest Modal */}
      {showCreatingQuest && selectedQuestType && (
        <Modal
          visible={showCreatingQuest}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={() => {}} // Prevent closing during creation
        >
          <CreatingQuestScreen
            questType={selectedQuestType}
            isGroupQuest={isGroupQuest}
            userLocation={currentLocation ? { latitude: currentLocation.lat, longitude: currentLocation.lng } : undefined}
            onQuestCreated={(questId, joinCode, questTitle) => {
              setShowCreatingQuest(false);
              
              if (isGroupQuest && joinCode) {
                // For group quests, show the join code screen
                setCreatedQuestData({
                  questId: questId || '',
                  joinCode: joinCode,
                  questTitle: questTitle || `${selectedQuestType === 'mystery' ? 'Mystery' : 'Scavenger Hunt'} Quest`,
                });
                setShowQuestCreated(true);
              } else {
                // For solo quests, show success alert
                setSelectedQuestType(null);
                setIsGroupQuest(false);
                Alert.alert('Success', 'Your quest has been created!', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // TODO: Navigate to the created quest or refresh quest list
                      if (questId) {
                        // Could navigate to quest detail
                      }
                    },
                  },
                ]);
              }
            }}
            onError={(error) => {
              setShowCreatingQuest(false);
              setSelectedQuestType(null);
              setIsGroupQuest(false);
              Alert.alert('Error', error);
            }}
          />
        </Modal>
      )}

      {/* Quest Created Modal (for group quests) */}
      <Modal
        visible={showQuestCreated}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowQuestCreated(false);
          setSelectedQuestType(null);
          setIsGroupQuest(false);
          setCreatedQuestData(null);
        }}
      >
        {createdQuestData && (
          <QuestCreatedScreen
            questId={createdQuestData.questId}
            questTitle={createdQuestData.questTitle}
            joinCode={createdQuestData.joinCode}
            onClose={() => {
              setShowQuestCreated(false);
              setSelectedQuestType(null);
              setIsGroupQuest(false);
              setCreatedQuestData(null);
            }}
            onViewQuest={() => {
              // TODO: Navigate to quest detail or refresh upcoming adventures
              setShowQuestCreated(false);
              setSelectedQuestType(null);
              setIsGroupQuest(false);
              setCreatedQuestData(null);
              // Could open UpcomingAdventuresScreen here
            }}
          />
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <HistoryScreen onClose={() => setShowHistory(false)} />
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <CalendarScreen onClose={() => setShowCalendar(false)} />
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilter={questFilter}
        onFilterChange={(filter) => {
          setQuestFilter(filter);
          if (!filter) {
            setFilteredPublicQuests(publicQuests);
          } else {
            // Apply filter logic
            let filtered = [...publicQuests];
            if (filter === 'starting_soon') {
              const now = new Date();
              filtered = filtered.filter((quest: any) => {
                if (quest.start_time) {
                  const startTime = new Date(quest.start_time);
                  const timeUntilStart = startTime.getTime() - now.getTime();
                  return timeUntilStart >= 0 && timeUntilStart <= 60 * 60 * 1000;
                }
                return false;
              });
            } else if (filter === 'nearby' && currentLocation) {
              filtered = filtered.filter((quest: any) => {
                if (quest.location_lat && quest.location_lng) {
                  const latDiff = Math.abs(quest.location_lat - currentLocation.lat);
                  const lngDiff = Math.abs(quest.location_lng - currentLocation.lng);
                  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
                  return distance <= 2;
                }
                return false;
              });
            } else if (filter === 'duration') {
              filtered = filtered.sort((a: any, b: any) => {
                const aDuration = a.estimated_time_minutes || 90;
                const bDuration = b.estimated_time_minutes || 90;
                return aDuration - bDuration;
              });
            } else if (filter === 'items') {
              filtered = filtered.filter((quest: any) => {
                return quest.item_rewards && quest.item_rewards.length > 0;
              });
            }
            setFilteredPublicQuests(filtered);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Quest Filters
  questFiltersContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  questFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questFilterText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    marginLeft: 6,
  },
  questFilterButtonActive: {
    backgroundColor: '#E0F7F7',
    borderWidth: 1,
    borderColor: '#17B2B2',
  },
  questFilterTextActive: {
    color: '#17B2B2',
    fontWeight: '600',
  },
  filterOption: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 12,
  },
  filterOptionActive: {
    backgroundColor: '#E0F7F7',
    borderWidth: 1,
    borderColor: '#17B2B2',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextActive: {
    color: '#17B2B2',
    fontWeight: '600',
  },
  // Right-Side Vertical Button Stack
  rightButtonStack: {
    position: 'absolute',
    right: 16,
    top: '15%',
    alignItems: 'center',
    gap: 12,
  },
  rightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  rightButtonActive: {
    backgroundColor: '#E0F7F7',
  },
  // Bottom Navigation Bar
  bottomNavBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 24,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shoppingBagButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  moreOptionsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  // Misc Menu Modal
  miscMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miscMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    position: 'relative',
    zIndex: 1,
  },
  miscMenuCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  miscMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  miscMenuButtonWrapper: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
  },
  miscMenuButtonWrapperCenter: {
    width: '100%',
  },
  miscMenuButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  miscMenuButtonLabel: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Organize Quest Modal
  organizeQuestContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  organizeQuestHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    position: 'relative',
  },
  organizeQuestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  organizeQuestCloseButton: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizeQuestContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  organizeQuestSection: {
    marginBottom: 24,
  },
  organizeQuestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  organizeQuestInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  organizeQuestInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  organizeQuestInputIcon: {
    marginLeft: 8,
  },
  organizeQuestGroupButtons: {
    flexDirection: 'row',
  },
  organizeQuestGroupButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#17B2B2',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizeQuestGroupButtonLast: {
    marginRight: 0,
  },
  organizeQuestGroupButtonActive: {
    backgroundColor: '#17B2B2',
    borderColor: '#17B2B2',
  },
  organizeQuestGroupButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17B2B2',
  },
  organizeQuestGroupButtonTextActive: {
    color: '#fff',
  },
  organizeQuestPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  organizeQuestPreviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  organizeQuestPreviewGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  organizeQuestPreviewMembers: {
    fontSize: 14,
    color: '#666',
  },
  organizeQuestFooter: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  organizeQuestCreateButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizeQuestCreateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
