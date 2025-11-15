import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopNavigationCardProps {
  destination: string;
  distance: string;
  walkTime: string;
  route: string;
}

export const TopNavigationCard: React.FC<TopNavigationCardProps> = ({
  destination,
  distance,
  walkTime,
  route,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="paper-plane" size={18} color="#000" />
        <Text style={styles.text} numberOfLines={1}>
          {destination}
        </Text>
        <Text style={styles.distance}>{distance}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="walk" size={18} color="#000" />
        <Text style={styles.text}>{walkTime}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="navigate" size={18} color="#000" />
        <Text style={styles.text}>Via {route}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});


