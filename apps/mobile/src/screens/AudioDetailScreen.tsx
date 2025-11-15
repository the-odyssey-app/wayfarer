import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: expo-av needs to be installed for audio playback
// import { Audio } from 'expo-av';

interface AudioDetailScreenProps {
  audioGuide: {
    id: string;
    title: string;
    duration: string;
    price: string;
    isFree: boolean;
    placeName?: string;
    description?: string;
    language?: string;
  };
  onClose?: () => void;
}

export const AudioDetailScreen: React.FC<AudioDetailScreenProps> = ({
  audioGuide,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(105); // in seconds (01:45)
  const [totalDuration, setTotalDuration] = useState(332); // in seconds (05:32)
  // const soundRef = useRef<Audio.Sound | null>(null);

  const defaultAudioGuide = {
    title: 'Market History',
    placeName: 'Pike Place Market',
    duration: '5m 32s',
    language: 'English',
    description: 'Learn about the rich history of Pike Place Market, from its founding in 1907 to its current status as one of America\'s most famous public markets. Discover interesting facts and stories about the market\'s iconic features and beloved traditions.',
    ...audioGuide,
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / totalDuration) * 100;

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        // Pause audio
        // if (soundRef.current) {
        //   await soundRef.current.pauseAsync();
        // }
        setIsPlaying(false);
      } else {
        // Play audio
        // if (soundRef.current) {
        //   await soundRef.current.playAsync();
        // }
        setIsPlaying(true);
        // Start progress simulation
        simulateProgress();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const simulateProgress = () => {
    // Simulate audio progress (remove this when using real audio)
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          clearInterval(interval);
          setIsPlaying(false);
          return totalDuration;
        }
        return prev + 1;
      });
    }, 1000);

    // Cleanup on unmount or pause
    if (!isPlaying) {
      clearInterval(interval);
    }
  };

  const handleSeek = (seconds: number) => {
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + seconds));
    setCurrentTime(newTime);
    // if (soundRef.current) {
    //   soundRef.current.setPositionAsync(newTime * 1000);
    // }
  };

  const handleSkipPrevious = () => {
    setCurrentTime(0);
    // if (soundRef.current) {
    //   soundRef.current.setPositionAsync(0);
    // }
  };

  const handleSkipNext = () => {
    setCurrentTime(totalDuration);
    setIsPlaying(false);
    // if (soundRef.current) {
    //   soundRef.current.setPositionAsync(totalDuration * 1000);
    // }
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Audio guide will be downloaded for offline use');
    // Implement download functionality
  };

  // Parse duration string to seconds
  useEffect(() => {
    const parseDuration = (duration: string) => {
      // Parse "5m 32s" format
      const match = duration.match(/(\d+)m\s*(\d+)s/);
      if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      }
      return 332; // default
    };
    setTotalDuration(parseDuration(defaultAudioGuide.duration));
  }, [defaultAudioGuide.duration]);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Audio Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content Card */}
          <View style={styles.card}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                  <Text style={styles.audioTitle}>{defaultAudioGuide.title}</Text>
                  <Text style={styles.placeName}>{defaultAudioGuide.placeName}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Meta Info */}
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{defaultAudioGuide.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{defaultAudioGuide.language || 'English'}</Text>
                </View>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{defaultAudioGuide.description}</Text>
            </View>

            {/* Audio Player Controls */}
            <View style={styles.playerSection}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <View style={styles.timeLabels}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
                </View>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleSkipPrevious}
                >
                  <Ionicons name="play-skip-back" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(-10)}
                >
                  <Ionicons name="play-back" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(10)}
                >
                  <Ionicons name="play-forward" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleSkipNext}
                >
                  <Ionicons name="play-skip-forward" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Download Button */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
            >
              <Text style={styles.downloadButtonText}>
                Download {defaultAudioGuide.isFree ? 'Free' : defaultAudioGuide.price}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    color: '#666',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  descriptionSection: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  playerSection: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#17B2B2',
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17B2B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  downloadButton: {
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

