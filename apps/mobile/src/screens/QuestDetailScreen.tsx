import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNakama } from '../contexts/NakamaContext';
import { QuestCompleteScreen } from './QuestCompleteScreen';
import { PartyScreen } from './PartyScreen';
import { RatingModal } from '../components/RatingModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface QuestDetailScreenProps {
  questId: string;
  onClose: () => void;
  onQuestStarted?: () => void;
}

interface QuestDetails {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  difficulty: number;
  xp_reward: number;
  reward_coins?: number;
  reward_items?: string[];
  estimated_time_minutes?: number;
  user_status: string;
  progress?: number;
  current_step_number?: number;
  steps?: QuestStep[];
}

interface QuestStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  success_criteria?: string;
  hint?: string;
  latitude?: number;
  longitude?: number;
}

export const QuestDetailScreen: React.FC<QuestDetailScreenProps> = ({
  questId,
  onClose,
  onQuestStarted,
}) => {
  const { callRpc, isConnected } = useNakama();
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);
  const [completionRewards, setCompletionRewards] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completingStep, setCompletingStep] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<QuestStep | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionPhoto, setSubmissionPhoto] = useState<string | null>(null);
  const [showParty, setShowParty] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const carouselRef = useRef<FlatList>(null);
  const [ratingSummary, setRatingSummary] = useState<{ overall_avg: number; difficulty_avg: number; fun_avg: number; ratings_count: number } | null>(null);

  const handleOpenParty = async () => {
    try {
      const status = await callRpc('get_verification_status', {});
      if (status?.success && status.verified) {
        setShowParty(true);
        return;
      }
      Alert.alert(
        'Verification required',
        'Please verify your account to use party features.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify now',
            onPress: async () => {
              try {
                const res = await callRpc('request_verification', { method: 'email' });
                if (res?.success) {
                  Alert.alert('Verification requested', 'We have sent your verification request. You will be notified once approved.');
                } else {
                  Alert.alert('Error', res?.error || 'Failed to start verification');
                }
              } catch (e) {
                Alert.alert('Error', 'Failed to start verification');
              }
            },
          },
        ]
      );
    } catch (e) {
      setShowParty(false);
    }
  };

  useEffect(() => {
    loadQuestDetails();
    getCurrentLocation();
  }, [questId]);

  useEffect(() => {
    // Auto-scroll to current step when quest loads
    if (quest && quest.current_step_number !== undefined && quest.steps && quest.steps.length > 0) {
      const stepIndex = quest.steps.findIndex(s => s.step_number === quest.current_step_number + 1);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
        setTimeout(() => {
          carouselRef.current?.scrollToIndex({ index: stepIndex, animated: true });
        }, 300);
      }
    }
  }, [quest]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadQuestDetails = async () => {
    try {
      setLoading(true);
      // Try to get detailed quest info with steps
      try {
        const detailResult = await callRpc('get_quest_detail', { questId });
        if (detailResult.success && detailResult.quest) {
          const questWithSteps: QuestDetails = {
            ...detailResult.quest,
            steps: detailResult.steps || [],
            user_status: detailResult.userQuest?.status || 'available',
            progress: detailResult.userQuest?.progress_percent || 0,
            current_step_number: detailResult.userQuest?.current_step_number || 0,
          };
          setQuest(questWithSteps);
          return;
        }
      } catch (e) {
        console.log('Detailed quest fetch failed, falling back to basic fetch');
      }
      
      // Fallback to basic quest list
      const result = await callRpc('get_available_quests');
      
      if (result.success && result.quests) {
        const foundQuest = result.quests.find((q: QuestDetails) => q.id === questId);
        if (foundQuest) {
          setQuest(foundQuest);
        }
      }
    } catch (error) {
      console.error('Error loading quest details:', error);
      Alert.alert('Error', 'Failed to load quest details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRatings = async () => {
      try {
        if (!questId) return;
        const res = await callRpc('get_quest_rating_summary', { questId });
        if (res?.success && res.summary) {
          setRatingSummary(res.summary);
        } else {
          setRatingSummary(null);
        }
      } catch (e) {
        setRatingSummary(null);
      }
    };
    loadRatings();
  }, [questId]);

  const handleStartQuest = async () => {
    if (!quest) return;

    try {
      setStarting(true);
      const result = await callRpc('start_quest', { quest_id: quest.id });

      if (result.success) {
        Alert.alert('Quest Started!', `You've started "${quest.title}"`);
        if (onQuestStarted) {
          onQuestStarted();
        }
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to start quest');
      }
    } catch (error) {
      console.error('Error starting quest:', error);
      Alert.alert('Error', 'Failed to start quest');
    } finally {
      setStarting(false);
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload via Nakama RPC
      const result = await callRpc('upload_photo', {
        imageBase64: base64,
        questId: quest?.id,
        stepId: selectedStep?.id,
      });

      if (result.success) {
        return result.url; // MinIO URL
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload photo. Continuing without photo.');
      return null;
    }
  };

  const handleCompleteStep = async (step: QuestStep) => {
    if (!quest || !userLocation) {
      Alert.alert('Error', 'Location is required. Please enable location services.');
      await getCurrentLocation();
      return;
    }

    try {
      setCompletingStep(true);
      
      // Upload photo first if provided
      let photoUrl: string | null = null;
      if (submissionPhoto) {
        photoUrl = await uploadPhoto(submissionPhoto);
      }
      
      // Submit media if provided
      if (photoUrl || submissionText) {
        try {
          await callRpc('submit_step_media', {
            questId: quest.id,
            stepId: step.id,
            mediaType: photoUrl ? 'photo' : 'text',
            mediaUrl: photoUrl || null,
            textContent: submissionText || null,
          });
        } catch (e) {
          console.log('Media submission failed, continuing with step completion');
        }
      }

      // Complete the step with location verification
      const result = await callRpc('complete_step', {
        questId: quest.id,
        stepId: step.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      });

      if (result.success) {
        if (result.questCompleted) {
          // Quest is complete, show completion screen
          const completeResult = await callRpc('complete_quest', { quest_id: quest.id });
          if (completeResult.success) {
            setCompletionRewards({
              xp: completeResult.xp_reward || completeResult.total_xp || 0,
              coins: 0,
              levelUp: completeResult.level_up || false,
              newLevel: completeResult.new_level || null,
            });
            // Show completion screen, then rating modal after
            setShowCompleteScreen(true);
          }
        } else {
          // Step completed, reload quest details
          await loadQuestDetails();
          setShowMediaModal(false);
          setSubmissionPhoto(null);
          setSubmissionText('');
          
          // Move to next step
          if (quest.steps && currentStepIndex < quest.steps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setTimeout(() => {
              carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            }, 300);
          }
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to complete step');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert('Error', 'Failed to complete step');
    } finally {
      setCompletingStep(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSubmissionPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSubmissionPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleCompleteQuest = async () => {
    if (!quest) return;

    try {
      setStarting(true);
      const result = await callRpc('complete_quest', { quest_id: quest.id });

      if (result.success) {
        // Show completion screen with rewards
        setCompletionRewards({
          xp: result.xp_reward || result.total_xp || 0,
          coins: 0, // Can be added if quest has coin rewards
          levelUp: result.level_up || false,
          newLevel: result.new_level || null,
          rankUp: result.rank_up || false,
          newRank: result.new_rank || null,
        });
        setShowCompleteScreen(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to complete quest');
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      Alert.alert('Error', 'Failed to complete quest');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitRating = async (rating: {
    overallRating: number;
    difficultyRating: number;
    funRating: number;
    feedbackText?: string;
  }) => {
    try {
      const result = await callRpc('submit_rating', {
        questId: quest?.id,
        overallRating: rating.overallRating,
        difficultyRating: rating.difficultyRating,
        funRating: rating.funRating,
        feedbackText: rating.feedbackText,
      });

      if (result.success) {
        Alert.alert('Success', 'Thank you for your feedback!');
      } else {
        Alert.alert('Error', result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quest details...</Text>
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quest not found</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isActive = quest.user_status === 'active';
  const isCompleted = quest.user_status === 'completed';
  const canStart = quest.user_status === 'available';
  const currentStepNumber = quest.current_step_number || 0;

  // Determine step status
  const getStepStatus = (step: QuestStep) => {
    if (isCompleted) return 'completed';
    if (!isActive) return 'locked';
    if (step.step_number < currentStepNumber + 1) return 'completed';
    if (step.step_number === currentStepNumber + 1) return 'current';
    return 'locked';
  };

  // Show completion screen if quest was just completed
  if (showCompleteScreen && completionRewards && quest) {
    return (
      <QuestCompleteScreen
        questId={quest.id}
        questTitle={quest.title}
        rewards={{
          xp: completionRewards.xp,
          coins: completionRewards.coins,
        }}
        stats={{
          completionTime: new Date().toLocaleString(),
        }}
        onContinue={() => {
          setShowCompleteScreen(false);
          // Show rating modal after completion
          setTimeout(() => {
            setShowRatingModal(true);
          }, 500);
          if (onQuestStarted) {
            onQuestStarted();
          }
        }}
        onNextQuest={() => {
          setShowCompleteScreen(false);
          // Show rating modal after completion
          setTimeout(() => {
            setShowRatingModal(true);
          }, 500);
          if (onQuestStarted) {
            onQuestStarted();
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quest Image Placeholder */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📍</Text>
          </View>
        </View>

        {/* Quest Title */}
        <Text style={styles.title}>{quest.title}</Text>
        {ratingSummary && ratingSummary.ratings_count > 0 && (
          <View style={styles.ratingSummaryRow}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingSummaryText}>
              {ratingSummary.overall_avg.toFixed(1)} ({ratingSummary.ratings_count})
            </Text>
          </View>
        )}

        {/* Quest Description */}
        <Text style={styles.description}>{quest.description}</Text>

          {/* Quest Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <Text style={styles.detailText}>
                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⭐</Text>
              <Text style={styles.detailText}>{quest.xp_reward} XP</Text>
            </View>

            {isActive && (
              <TouchableOpacity
                style={styles.partyButton}
                onPress={handleOpenParty}
              >
                <Text style={styles.partyButtonIcon}>👥</Text>
                <Text style={styles.partyButtonText}>Party</Text>
              </TouchableOpacity>
            )}

          {quest.reward_coins && quest.reward_coins > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🪙</Text>
              <Text style={styles.detailText}>{quest.reward_coins} Coins</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <Text style={styles.detailText}>
              {quest.estimated_time_minutes || 90} mins
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📊</Text>
            <Text style={styles.detailText}>
              Difficulty: {['Easy', 'Medium', 'Hard'][quest.difficulty - 1] || 'Medium'}
            </Text>
          </View>

          {isActive && quest.progress !== undefined && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress: {quest.progress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${quest.progress}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Quest Steps Carousel */}
        {quest.steps && quest.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionTitle}>Quest Steps</Text>
              {isActive && (
                <Text style={styles.stepProgress}>
                  Step {currentStepNumber + 1} of {quest.steps.length}
                </Text>
              )}
            </View>

            {/* Progress Indicator */}
            {isActive && (
              <View style={styles.progressIndicatorContainer}>
                {quest.steps.map((step, index) => {
                  const status = getStepStatus(step);
                  return (
                    <View
                      key={step.id}
                      style={[
                        styles.progressDot,
                        status === 'completed' && styles.progressDotCompleted,
                        status === 'current' && styles.progressDotCurrent,
                        status === 'locked' && styles.progressDotLocked,
                      ]}
                    />
                  );
                })}
              </View>
            )}

            {/* Step Carousel */}
            <FlatList
              ref={carouselRef}
              data={quest.steps}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentStepIndex(index);
              }}
              onScrollToIndexFailed={(info) => {
                // Fallback: scroll to offset
                setTimeout(() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollToOffset({
                      offset: info.averageItemLength * info.index,
                      animated: true,
                    });
                  }
                }, 100);
              }}
              renderItem={({ item: step, index }) => {
                const status = getStepStatus(step);
                const isCurrentStep = status === 'current';
                
                return (
                  <View style={styles.stepCarouselItem}>
                    <View style={[
                      styles.stepCard,
                      isCurrentStep && styles.stepCardCurrent,
                      status === 'completed' && styles.stepCardCompleted,
                      status === 'locked' && styles.stepCardLocked,
                    ]}>
                      <View style={styles.stepHeader}>
                        <View style={[
                          styles.stepNumber,
                          status === 'completed' && styles.stepNumberCompleted,
                          isCurrentStep && styles.stepNumberCurrent,
                          status === 'locked' && styles.stepNumberLocked,
                        ]}>
                          {status === 'completed' ? (
                            <Text style={styles.stepNumberText}>✓</Text>
                          ) : (
                            <Text style={styles.stepNumberText}>{step.step_number}</Text>
                          )}
                        </View>
                        <View style={styles.stepTitleContainer}>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                          {isCurrentStep && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                      {step.success_criteria && (
                        <View style={styles.criteriaContainer}>
                          <Text style={styles.criteriaLabel}>Success Criteria:</Text>
                          <Text style={styles.criteriaText}>{step.success_criteria}</Text>
                        </View>
                      )}
                      {step.hint && (
                        <View style={styles.hintContainer}>
                          <Text style={styles.hintLabel}>💡 Hint:</Text>
                          <Text style={styles.hintText}>{step.hint}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartQuest}
            disabled={starting || !isConnected}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Join Quest</Text>
            )}
          </TouchableOpacity>
        )}

        {isActive && quest.steps && quest.steps.length > 0 && (
          <>
            {(() => {
              const currentStep = quest.steps.find(s => s.step_number === currentStepNumber + 1);
              const stepStatus = currentStep ? getStepStatus(currentStep) : 'locked';
              
              if (stepStatus === 'current') {
                return (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeStepButton]}
                    onPress={() => {
                      if (currentStep) {
                        setSelectedStep(currentStep);
                        setShowMediaModal(true);
                      }
                    }}
                    disabled={completingStep || !isConnected}
                  >
                    {completingStep ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Complete Step {currentStepNumber + 1}</Text>
                    )}
                  </TouchableOpacity>
                );
              }
              
              // Check if all steps are completed
              const allStepsCompleted = quest.steps.every(s => getStepStatus(s) === 'completed');
              if (allStepsCompleted) {
                return (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={handleCompleteQuest}
                    disabled={starting || !isConnected}
                  >
                    {starting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Complete Quest</Text>
                    )}
                  </TouchableOpacity>
                );
              }
              
              return null;
            })()}
          </>
        )}

        {isCompleted && (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Text style={styles.completedButtonText}>✓ Completed</Text>
          </View>
        )}
      </View>

      {/* Media Submission Modal */}
      <Modal
        visible={showMediaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Step {selectedStep?.step_number}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMediaModal(false);
                  setSubmissionPhoto(null);
                  setSubmissionText('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedStep && (
                <>
                  <Text style={styles.modalStepTitle}>{selectedStep.title}</Text>
                  <Text style={styles.modalStepDescription}>{selectedStep.description}</Text>
                  
                  {selectedStep.success_criteria && (
                    <View style={styles.modalCriteriaContainer}>
                      <Text style={styles.modalCriteriaLabel}>Success Criteria:</Text>
                      <Text style={styles.modalCriteriaText}>{selectedStep.success_criteria}</Text>
                    </View>
                  )}

                  {/* Photo Submission */}
                  <View style={styles.mediaSection}>
                    <Text style={styles.mediaSectionTitle}>Photo (Optional)</Text>
                    {submissionPhoto ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: submissionPhoto }} style={styles.photoPreview} />
                        <TouchableOpacity
                          onPress={() => setSubmissionPhoto(null)}
                          style={styles.removePhotoButton}
                        >
                          <Text style={styles.removePhotoText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.photoButtonsContainer}>
                        <TouchableOpacity
                          onPress={handleTakePhoto}
                          style={styles.photoButton}
                        >
                          <Text style={styles.photoButtonText}>📷 Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handlePickImage}
                          style={styles.photoButton}
                        >
                          <Text style={styles.photoButtonText}>🖼️ Choose from Gallery</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Text Submission */}
                  <View style={styles.mediaSection}>
                    <Text style={styles.mediaSectionTitle}>Text Response (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your response..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      value={submissionText}
                      onChangeText={setSubmissionText}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowMediaModal(false);
                  setSubmissionPhoto(null);
                  setSubmissionText('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={() => {
                  if (selectedStep) {
                    handleCompleteStep(selectedStep);
                  }
                }}
                disabled={completingStep}
              >
                {completingStep ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Complete Step</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Party Modal */}
      <Modal
        visible={showParty}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowParty(false)}
      >
        <PartyScreen
          questId={quest?.id}
          onClose={() => setShowParty(false)}
          onPartyJoined={(partyId) => {
            console.log('Joined party:', partyId);
            setShowParty(false);
          }}
        />
      </Modal>

      {/* Rating Modal */}
      {quest && (
        <RatingModal
          visible={showRatingModal}
          questId={quest.id}
          questTitle={quest.title}
          onSubmit={handleSubmitRating}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  ratingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -8,
    marginBottom: 16,
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 6,
  },
  ratingSummaryText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  partyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  partyButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  partyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#17B26A',
  },
  completeButton: {
    backgroundColor: '#FF9500',
  },
  completedButton: {
    backgroundColor: '#e0e0e0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  criteriaContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  criteriaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  criteriaText: {
    fontSize: 14,
    color: '#333',
  },
  hintContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#856404',
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepProgress: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  progressIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotCompleted: {
    backgroundColor: '#34C759',
  },
  progressDotCurrent: {
    backgroundColor: '#007AFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotLocked: {
    backgroundColor: '#e0e0e0',
  },
  stepCarouselItem: {
    width: SCREEN_WIDTH - 40,
    paddingHorizontal: 10,
  },
  stepCardCurrent: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  stepCardCompleted: {
    backgroundColor: '#f0fdf4',
    opacity: 0.8,
  },
  stepCardLocked: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  stepTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  stepNumberCompleted: {
    backgroundColor: '#34C759',
  },
  stepNumberCurrent: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#0051d5',
  },
  stepNumberLocked: {
    backgroundColor: '#999',
  },
  completeStepButton: {
    backgroundColor: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
  },
  modalStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalStepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCriteriaContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalCriteriaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  modalCriteriaText: {
    fontSize: 14,
    color: '#333',
  },
  mediaSection: {
    marginBottom: 24,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
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

