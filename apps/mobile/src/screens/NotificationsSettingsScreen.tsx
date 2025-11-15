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

interface NotificationsSettingsScreenProps {
  onClose?: () => void;
  onSave?: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  locationUpdates: boolean;
  achievementAlerts: boolean;
  socialUpdates: boolean;
  weeklyDigest: boolean;
}

interface NotificationOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const NotificationsSettingsScreen: React.FC<NotificationsSettingsScreenProps> = ({
  onClose,
  onSave,
}) => {
  const [locationUpdates, setLocationUpdates] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [socialUpdates, setSocialUpdates] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const handleSave = () => {
    if (onSave) {
      onSave({
        locationUpdates,
        achievementAlerts,
        socialUpdates,
        weeklyDigest,
      });
    }
    Alert.alert('Success', 'Notification settings saved');
    if (onClose) {
      onClose();
    }
  };

  const pushNotifications: NotificationOption[] = [
    {
      id: 'location',
      title: 'Location Updates',
      subtitle: 'Nearby quests and events',
      icon: 'location',
      iconColor: '#17B2B2',
      value: locationUpdates,
      onChange: setLocationUpdates,
    },
    {
      id: 'achievement',
      title: 'Achievement Alerts',
      subtitle: 'Quest completion and rewards',
      icon: 'trophy',
      iconColor: '#17B2B2',
      value: achievementAlerts,
      onChange: setAchievementAlerts,
    },
    {
      id: 'social',
      title: 'Social Updates',
      subtitle: 'Friend activities and messages',
      icon: 'people',
      iconColor: '#17B2B2',
      value: socialUpdates,
      onChange: setSocialUpdates,
    },
  ];

  const emailNotifications: NotificationOption[] = [
    {
      id: 'digest',
      title: 'Weekly Digest',
      subtitle: 'Activity summary and updates',
      icon: 'mail',
      iconColor: '#FF9500',
      value: weeklyDigest,
      onChange: setWeeklyDigest,
    },
  ];

  const renderNotificationOption = (option: NotificationOption) => (
    <View key={option.id} style={styles.notificationOption}>
      <View style={styles.notificationLeft}>
        <View style={[styles.notificationIcon, { backgroundColor: option.iconColor }]}>
          <Ionicons name={option.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{option.title}</Text>
          <Text style={styles.notificationSubtitle}>{option.subtitle}</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          {pushNotifications.map(renderNotificationOption)}
        </View>

        {/* Email Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          {emailNotifications.map(renderNotificationOption)}
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
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});

