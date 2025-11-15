import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySettingsScreenProps {
  onClose?: () => void;
  onSave?: (settings: PrivacySettings) => void;
}

interface PrivacySettings {
  publicProfile: boolean;
  locationSharing: boolean;
  twoFactorAuth: boolean;
}

interface PrivacyOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  onClose,
  onSave,
}) => {
  const [publicProfile, setPublicProfile] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  const handleSave = () => {
    if (onSave) {
      onSave({
        publicProfile,
        locationSharing,
        twoFactorAuth,
      });
    }
    Alert.alert('Success', 'Privacy settings saved');
    if (onClose) {
      onClose();
    }
  };

  const handleDownloadData = () => {
    Alert.alert('Download Data', 'Your data will be prepared and sent to your email');
    // Implement download data functionality
  };

  const profileVisibilityOptions: PrivacyOption[] = [
    {
      id: 'public',
      title: 'Public Profile',
      subtitle: 'Visible to everyone',
      icon: 'people',
      iconColor: '#17B2B2',
      value: publicProfile,
      onChange: setPublicProfile,
    },
    {
      id: 'location',
      title: 'Location Sharing',
      subtitle: 'Show location on profile',
      icon: 'location',
      iconColor: '#17B2B2',
      value: locationSharing,
      onChange: setLocationSharing,
    },
  ];

  const dataSecurityOptions: PrivacyOption[] = [
    {
      id: 'twoFactor',
      title: 'Two-Factor Auth',
      subtitle: 'Enhanced security',
      icon: 'shield-checkmark',
      iconColor: '#17B2B2',
      value: twoFactorAuth,
      onChange: setTwoFactorAuth,
    },
  ];

  const renderPrivacyOption = (option: PrivacyOption) => (
    <View key={option.id} style={styles.privacyOption}>
      <View style={styles.privacyLeft}>
        <View style={[styles.privacyIcon, { backgroundColor: option.iconColor }]}>
          <Ionicons name={option.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.privacyInfo}>
          <Text style={styles.privacyTitle}>{option.title}</Text>
          <Text style={styles.privacySubtitle}>{option.subtitle}</Text>
        </View>
      </View>
      <Switch
        value={option.value}
        onValueChange={option.onChange}
        trackColor={{ false: '#f0f0f0', true: '#17B2B2' }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          {profileVisibilityOptions.map(renderPrivacyOption)}
        </View>

        {/* Data & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Security</Text>
          {dataSecurityOptions.map(renderPrivacyOption)}
          
          {/* Download My Data Option */}
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={handleDownloadData}
          >
            <View style={styles.privacyLeft}>
              <View style={[styles.privacyIcon, { backgroundColor: '#17B2B2' }]}>
                <Ionicons name="download" size={20} color="#fff" />
              </View>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Download My Data</Text>
                <Text style={styles.privacySubtitle}>Get a copy of your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 12,
    color: '#666',
  },
});

