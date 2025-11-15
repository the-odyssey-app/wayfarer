import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrivacySettingsScreen } from './PrivacySettingsScreen';

interface SettingsScreenProps {
  onClose?: () => void;
}

interface SettingOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  type: 'toggle' | 'navigate';
  value?: boolean;
  onChange?: (value: boolean) => void;
  onPress?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
}) => {
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const settings: SettingOption[] = [
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Manage your privacy and security',
      icon: 'lock-closed',
      iconColor: '#17B2B2',
      type: 'navigate',
      onPress: () => setShowPrivacySettings(true),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      icon: 'notifications',
      iconColor: '#17B2B2',
      type: 'navigate',
      onPress: () => {
        // Navigate to notifications settings
        Alert.alert('Notifications', 'Navigate to notifications settings');
      },
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: 'Change app language',
      icon: 'language',
      iconColor: '#17B2B2',
      type: 'navigate',
      onPress: () => {
        Alert.alert('Language', 'Select language');
      },
    },
  ];

  const renderSettingOption = (option: SettingOption) => {
    if (option.type === 'toggle') {
      return (
        <View key={option.id} style={styles.settingOption}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: option.iconColor }]}>
              <Ionicons name={option.icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
            </View>
          </View>
          <Switch
            value={option.value || false}
            onValueChange={option.onChange}
            trackColor={{ false: '#f0f0f0', true: '#17B2B2' }}
            thumbColor="#fff"
          />
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          key={option.id}
          style={styles.settingOption}
          onPress={option.onPress}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: option.iconColor }]}>
              <Ionicons name={option.icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settings.map(renderSettingOption)}
      </ScrollView>

      {/* Privacy Settings Modal */}
      <Modal
        visible={showPrivacySettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacySettings(false)}
      >
        <PrivacySettingsScreen onClose={() => setShowPrivacySettings(false)} />
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
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});

