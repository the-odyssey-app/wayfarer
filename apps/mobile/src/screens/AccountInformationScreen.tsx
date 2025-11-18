import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationsSettingsScreen } from './NotificationsSettingsScreen';
import { useNakama } from '../contexts/NakamaContext';

interface AccountInformationScreenProps {
  userId: string;
  username: string;
  onClose?: () => void;
  onSave?: (data: AccountData) => void;
}

interface AccountData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  language: string;
  pushNotifications: boolean;
}

export const AccountInformationScreen: React.FC<AccountInformationScreenProps> = ({
  userId,
  username,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('John Cooper');
  const [usernameValue, setUsernameValue] = useState(username);
  const [email, setEmail] = useState('john.cooper@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [language, setLanguage] = useState('English');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [showNotificationsSettings, setShowNotificationsSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateUsername } = useNakama();

  // Update usernameValue when username prop changes
  useEffect(() => {
    setUsernameValue(username);
  }, [username]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update username if it changed
      if (usernameValue.trim() && usernameValue !== username) {
        const result = await updateUsername(usernameValue.trim());
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to update username');
          setIsSaving(false);
          return;
        }
      }
      
      if (onSave) {
        onSave({
          fullName,
          username: usernameValue,
          email,
          phone,
          language,
          pushNotifications,
        });
      }
      Alert.alert('Success', 'Account information saved');
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save account information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Information</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profilePictureContainer}>
              <View style={styles.profilePicture}>
                <Ionicons name="person" size={40} color="#17B2B2" />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName}</Text>
              {isPremium && (
                <Text style={styles.membershipStatus}>Premium Member</Text>
              )}
            </View>
          </View>

          {/* Input Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              testID="username_input"
              style={styles.input}
              value={usernameValue}
              onChangeText={setUsernameValue}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {/* Language Setting */}
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="globe-outline" size={20} color="#17B2B2" />
              </View>
              <Text style={styles.preferenceLabel}>Language</Text>
            </View>
            <View style={styles.preferenceRight}>
              <Text style={styles.preferenceValue}>{language}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Push Notifications Setting */}
          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => setShowNotificationsSettings(true)}
          >
            <View style={styles.preferenceLeft}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="notifications-outline" size={20} color="#17B2B2" />
              </View>
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
            </View>
            <View style={styles.preferenceRight}>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#f0f0f0', true: '#17B2B2' }}
                thumbColor="#fff"
                disabled={true}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notifications Settings Modal */}
      <Modal
        visible={showNotificationsSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationsSettings(false)}
      >
        <NotificationsSettingsScreen
          onClose={() => setShowNotificationsSettings(false)}
          onSave={(settings) => {
            // Update push notifications based on any enabled setting
            setPushNotifications(
              settings.locationUpdates ||
              settings.achievementAlerts ||
              settings.socialUpdates
            );
          }}
        />
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17B2B2',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profilePictureContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#17B2B2',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#17B2B2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  membershipStatus: {
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  preferenceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
  },
});

