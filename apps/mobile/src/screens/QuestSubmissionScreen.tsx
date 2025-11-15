import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface QuestSubmissionScreenProps {
  quest: {
    id: string;
    title: string;
    currentStep: number;
    totalSteps: number;
    stepTitle?: string;
    instructions?: string;
    hint?: string;
    requiresPhoto?: boolean;
    requiresText?: boolean;
  };
  onClose: () => void;
  onSubmit: (submission: QuestSubmission) => void;
}

interface QuestSubmission {
  photoUri?: string;
  text?: string;
}

export const QuestSubmissionScreen: React.FC<QuestSubmissionScreenProps> = ({
  quest,
  onClose,
  onSubmit,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleProceedToConfirmation = () => {
    // Validate submission based on requirements
    if (quest.requiresPhoto && !photoUri) {
      Alert.alert('Photo Required', 'Please take or select a photo to complete this task');
      return;
    }

    if (quest.requiresText && !text.trim()) {
      Alert.alert('Text Required', 'Please enter text to complete this task');
      return;
    }

    if (quest.requiresPhoto && quest.requiresText && (!photoUri || !text.trim())) {
      Alert.alert('Submission Incomplete', 'Please provide both a photo and text to complete this task');
      return;
    }

    // Show confirmation screen
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit({
      photoUri: photoUri || undefined,
      text: text.trim() || undefined,
      caption: caption.trim() || undefined,
    });
  };

  const handleBackToEdit = () => {
    setShowConfirmation(false);
  };

  const canSubmit = () => {
    if (quest.requiresPhoto && !photoUri) return false;
    if (quest.requiresText && !text.trim()) return false;
    if (quest.requiresPhoto && quest.requiresText && (!photoUri || !text.trim())) return false;
    return true;
  };

  // Confirmation View
  if (showConfirmation) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quest Submission</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="code" size={24} color="#34C759" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Quest Step Banner */}
          <View style={styles.confirmationBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                {quest.stepTitle || quest.title || 'String value'}
              </Text>
              <Text style={styles.bannerStep}>
                Step {quest.currentStep} of {quest.totalSteps}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBannerButton}>
              <Ionicons name="close" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions:</Text>
            <Text style={styles.instructionsText}>
              {quest.instructions || 'String value'}
            </Text>
          </View>

          {/* Photo Preview */}
          {photoUri && (
            <View style={styles.section}>
              <Image source={{ uri: photoUri }} style={styles.confirmationPhoto} />
            </View>
          )}

          {/* Text Preview */}
          {text.trim() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Response:</Text>
              <Text style={styles.textPreview}>{text}</Text>
            </View>
          )}

          {/* Caption Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add your caption here..."
              value={caption}
              onChangeText={setCaption}
              placeholderTextColor="#999"
              multiline
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.confirmationButtons}>
            <TouchableOpacity style={styles.cancelConfirmButton} onPress={handleBackToEdit}>
              <Text style={styles.cancelConfirmButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitConfirmButton} onPress={handleConfirmSubmit}>
              <Text style={styles.submitConfirmButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Initial Submission View
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quest Submission</Text>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="code" size={24} color="#34C759" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quest Step Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              {quest.stepTitle || quest.title || 'String value'}
            </Text>
            <Text style={styles.bannerStep}>
              Step {quest.currentStep} of {quest.totalSteps}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBannerButton}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>
            {quest.instructions || 'String value'}
          </Text>
        </View>

        {/* Hint Section */}
        {quest.hint && (
          <View style={styles.hintContainer}>
            <TouchableOpacity
              style={styles.hintHeader}
              onPress={() => setShowHint(!showHint)}
            >
              <Text style={styles.hintLabel}>Hint:</Text>
              <Ionicons
                name={showHint ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#FF9500"
              />
            </TouchableOpacity>
            {showHint && <Text style={styles.hintText}>{quest.hint}</Text>}
          </View>
        )}

        {/* Photo Submission Section */}
        {quest.requiresPhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Submission</Text>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={48} color="#FF9500" />
                </TouchableOpacity>
                <Text style={styles.photoButtonText}>Tap to take a photo</Text>
                <TouchableOpacity onPress={handleSelectFromGallery}>
                  <Text style={styles.galleryLink}>or select from gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Text Submission Section */}
        {quest.requiresText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text Submission</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              placeholder="Enter your response here..."
              value={text}
              onChangeText={setText}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Proceed Button */}
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleProceedToConfirmation}
          disabled={!canSubmit()}
        >
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    backgroundColor: '#FF9500',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerStep: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  closeBannerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  hintContainer: {
    backgroundColor: '#FFF4E6',
    margin: 20,
    marginTop: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 16,
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  photoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  photoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cameraButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  galleryLink: {
    fontSize: 14,
    color: '#999',
  },
  textInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 150,
  },
  submitButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    margin: 20,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmationBanner: {
    backgroundColor: '#FFD700',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmationPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  textPreview: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  captionInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmationButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelConfirmButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelConfirmButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitConfirmButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

