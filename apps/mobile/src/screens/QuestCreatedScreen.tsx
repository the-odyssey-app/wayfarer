import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: expo-clipboard may need to be installed: npx expo install expo-clipboard
// For now, using Share API as fallback

interface QuestCreatedScreenProps {
  questId: string;
  questTitle: string;
  joinCode: string;
  onClose: () => void;
  onViewQuest?: () => void;
}

export const QuestCreatedScreen: React.FC<QuestCreatedScreenProps> = ({
  questId,
  questTitle,
  joinCode,
  onClose,
  onViewQuest,
}) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      // Use Share API to copy/share the code
      // Note: For actual clipboard functionality, install expo-clipboard: npx expo install expo-clipboard
      await Share.share({
        message: `Join Code: ${joinCode}`,
        title: 'Join Code',
      });
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to share join code');
    }
  };

  const handleShareCode = async () => {
    try {
      const result = await Share.share({
        message: `Join my quest "${questTitle}"! Use join code: ${joinCode}`,
        title: 'Join My Quest',
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share join code');
    }
  };

  const handleShareQR = () => {
    // TODO: Generate and share QR code
    Alert.alert('QR Code', 'QR code sharing coming soon');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quest Created!</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#34C759" />
        </View>

        {/* Quest Title */}
        <Text style={styles.questTitle}>{questTitle}</Text>
        <Text style={styles.subtitle}>Your private quest is ready!</Text>

        {/* Join Code Section */}
        <View style={styles.joinCodeSection}>
          <Text style={styles.joinCodeLabel}>Join Code</Text>
          <View style={styles.joinCodeContainer}>
            <Text style={styles.joinCode}>{joinCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Ionicons
                name={codeCopied ? 'checkmark' : 'copy-outline'}
                size={24}
                color={codeCopied ? '#34C759' : '#17B2B2'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.joinCodeHint}>
            Share this code with friends so they can join your quest
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Share Code Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareCode}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Share Join Code</Text>
          </TouchableOpacity>

          {/* Share QR Code Button */}
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleShareQR}
          >
            <Ionicons name="qr-code-outline" size={24} color="#17B2B2" />
            <Text style={styles.qrButtonText}>Share QR Code</Text>
          </TouchableOpacity>

          {/* View Quest Button */}
          {onViewQuest && (
            <TouchableOpacity
              style={styles.viewQuestButton}
              onPress={onViewQuest}
            >
              <Text style={styles.viewQuestButtonText}>View Quest</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  questTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  joinCodeSection: {
    width: '100%',
    marginBottom: 32,
  },
  joinCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#17B2B2',
  },
  joinCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 4,
    marginRight: 16,
  },
  copyButton: {
    padding: 8,
  },
  joinCodeHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#17B2B2',
    gap: 8,
  },
  qrButtonText: {
    color: '#17B2B2',
    fontSize: 16,
    fontWeight: '600',
  },
  viewQuestButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  viewQuestButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

