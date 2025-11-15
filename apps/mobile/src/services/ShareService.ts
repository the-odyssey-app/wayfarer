import { Share, Alert } from 'react-native';

export class ShareService {
  /**
   * Share quest details
   */
  static async shareQuest(quest: {
    id: string;
    title: string;
    description?: string;
    joinCode?: string;
  }): Promise<void> {
    try {
      const message = quest.joinCode
        ? `Join my quest "${quest.title}"! Use join code: ${quest.joinCode}`
        : `Check out this quest: "${quest.title}"${quest.description ? `\n\n${quest.description}` : ''}`;

      await Share.share({
        message,
        title: 'Share Quest',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share quest');
      }
    }
  }

  /**
   * Share achievement
   */
  static async shareAchievement(achievement: {
    title: string;
    description?: string;
    xp?: number;
  }): Promise<void> {
    try {
      const message = `I just unlocked: ${achievement.title}!${achievement.xp ? ` (+${achievement.xp} XP)` : ''}${achievement.description ? `\n\n${achievement.description}` : ''}`;

      await Share.share({
        message,
        title: 'Share Achievement',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share achievement');
      }
    }
  }

  /**
   * Share quest completion
   */
  static async shareQuestCompletion(quest: {
    title: string;
    xpReward?: number;
    completedAt?: string;
  }): Promise<void> {
    try {
      const message = `I just completed "${quest.title}"!${quest.xpReward ? ` Earned ${quest.xpReward} XP!` : ''} 🎉`;

      await Share.share({
        message,
        title: 'Quest Completed',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share completion');
      }
    }
  }

  /**
   * Share user profile/level
   */
  static async shareProfile(user: {
    username: string;
    level: number;
    xp?: number;
  }): Promise<void> {
    try {
      const message = `Check out my Wayfarer profile! I'm level ${user.level}${user.xp ? ` with ${user.xp} XP` : ''}. Join me on Wayfarer!`;

      await Share.share({
        message,
        title: 'Share Profile',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share profile');
      }
    }
  }

  /**
   * Share a moment from a place
   */
  static async shareMoment(moment: {
    userName: string;
    text?: string;
    placeName: string;
  }): Promise<void> {
    try {
      const message = `${moment.userName} shared a moment from ${moment.placeName}${moment.text ? `:\n\n"${moment.text}"` : ''}\n\nCheck it out on Wayfarer!`;

      await Share.share({
        message,
        title: 'Share Moment',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share moment');
      }
    }
  }
}

