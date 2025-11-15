import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';

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
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCodeRef = useRef<View | null>(null);

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
    setShowQRModal(true);
  };

  const handleShareQRCode = async () => {
    try {
      if (!qrCodeRef.current) {
        Alert.alert('Error', 'QR code not ready');
        return;
      }

      // Capture QR code as image
      const uri = await captureRef(qrCodeRef.current, {
        format: 'png',
        quality: 1.0,
      });

      // Share the QR code image
      await Share.share({
        message: `Scan to join my quest "${questTitle}"! Join code: ${joinCode}`,
        url: uri,
        title: 'Quest QR Code',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share QR code');
    }
  };

  const getQRCodeData = () => {
    // Create a JSON object with quest information for the QR code
    return JSON.stringify({
      type: 'join_quest',
      questId: questId,
      joinCode: joinCode,
      title: questTitle,
    });
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

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quest QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Scan this code to join "{questTitle}"
              </Text>
              
              <View style={styles.qrCodeContainer} ref={qrCodeRef} collapsable={false}>
                <QRCode
                  value={getQRCodeData()}
                  size={250}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  logoSize={50}
                  logoMargin={5}
                  logoBackgroundColor="#FFFFFF"
                />
              </View>

              <View style={styles.joinCodeInfo}>
                <Text style={styles.joinCodeInfoLabel}>Join Code:</Text>
                <Text style={styles.joinCodeInfoValue}>{joinCode}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.shareQRButton}
                  onPress={handleShareQRCode}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                  <Text style={styles.shareQRButtonText}>Share QR Code</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCodeInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  joinCodeInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  joinCodeInfoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#17B2B2',
    letterSpacing: 2,
  },
  modalActions: {
    width: '100%',
  },
  shareQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17B2B2',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  shareQRButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

