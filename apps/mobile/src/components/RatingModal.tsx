import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

interface RatingModalProps {
  visible: boolean;
  questId: string;
  questTitle: string;
  onSubmit: (rating: {
    overallRating: number;
    difficultyRating: number;
    funRating: number;
    feedbackText?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  questId,
  questTitle,
  onSubmit,
  onClose,
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [funRating, setFunRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        overallRating: overallRating || difficultyRating || funRating || 3,
        difficultyRating: difficultyRating || overallRating || 3,
        funRating: funRating || overallRating || 3,
        feedbackText: feedbackText.trim() || undefined,
      });
      // Reset form
      setOverallRating(0);
      setDifficultyRating(0);
      setFunRating(0);
      setFeedbackText('');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}
          >
            <Text style={styles.starIcon}>{star <= rating ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.questTitle}>{questTitle}</Text>

            {/* Overall Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Overall Rating *</Text>
              {renderStars(overallRating, setOverallRating)}
              {overallRating > 0 && (
                <Text style={styles.ratingText}>
                  {overallRating === 5 ? 'Excellent' :
                   overallRating === 4 ? 'Great' :
                   overallRating === 3 ? 'Good' :
                   overallRating === 2 ? 'Fair' : 'Poor'}
                </Text>
              )}
            </View>

            {/* Difficulty Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Difficulty</Text>
              {renderStars(difficultyRating, setDifficultyRating)}
              {difficultyRating > 0 && (
                <Text style={styles.ratingText}>
                  {difficultyRating === 5 ? 'Very Hard' :
                   difficultyRating === 4 ? 'Hard' :
                   difficultyRating === 3 ? 'Moderate' :
                   difficultyRating === 2 ? 'Easy' : 'Very Easy'}
                </Text>
              )}
            </View>

            {/* Fun Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How Fun Was It?</Text>
              {renderStars(funRating, setFunRating)}
              {funRating > 0 && (
                <Text style={styles.ratingText}>
                  {funRating === 5 ? 'Extremely Fun' :
                   funRating === 4 ? 'Very Fun' :
                   funRating === 3 ? 'Fun' :
                   funRating === 2 ? 'Somewhat Fun' : 'Not Fun'}
                </Text>
              )}
            </View>

            {/* Feedback Text */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Feedback (Optional)</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Share your thoughts about this quest..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {feedbackText.length}/500
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.skipButton]}
              onPress={onClose}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.submitButton,
                overallRating === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || overallRating === 0}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  modalScroll: {
    padding: 20,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 32,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f8f9fa',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
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
  skipButton: {
    backgroundColor: '#f0f0f0',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

