import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavigationCardProps {
  quest: {
    id: string;
    title: string;
    currentStep?: number;
    totalSteps?: number;
    placeName?: string;
    placeAddress?: string;
  };
  isNavigating?: boolean;
  hasArrived?: boolean;
  nextStop?: {
    name: string;
    distance: string;
    walkTime: string;
  };
  onNavigate?: () => void;
  onViewPlaceDetails?: () => void;
  onEndRoute?: () => void;
  onCompleteTask?: () => void;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  quest,
  isNavigating = false,
  hasArrived = false,
  nextStop,
  onNavigate,
  onViewPlaceDetails,
  onEndRoute,
  onCompleteTask,
}) => {
  const currentStep = quest.currentStep || 1;
  const totalSteps = quest.totalSteps || 10;
  const progress = (currentStep / totalSteps) * 100;

  // If user has arrived at the location, show complete task card
  if (hasArrived) {
    return (
      <View style={styles.container}>
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Step {currentStep}/{totalSteps}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <TouchableOpacity onPress={onViewPlaceDetails}>
            <Text style={styles.viewDetailsLink}>View Place Details</Text>
          </TouchableOpacity>
        </View>

        {/* Place Information */}
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>
            {quest.placeName || quest.title || 'String value'}
          </Text>
          <Text style={styles.placeAddress}>
            {quest.placeAddress || 'String value'}
          </Text>
        </View>

        {/* Complete Task Button */}
        <TouchableOpacity style={styles.completeTaskButton} onPress={onCompleteTask}>
          <Text style={styles.completeTaskButtonText}>Complete Task</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If actively navigating, show the bottom navigation card
  if (isNavigating && nextStop) {
    return (
      <View style={styles.navigatingContainer}>
        <View style={styles.nextStopHeader}>
          <Ionicons name="location" size={18} color="#17B2B2" />
          <Text style={styles.nextStopLabel}>Next Stop</Text>
          <Text style={styles.nextStopName} numberOfLines={1}>
            {nextStop.name}
          </Text>
          <Text style={styles.nextStopDistance}>{nextStop.distance}</Text>
        </View>
        <Text style={styles.nextStopWalkTime}>{nextStop.walkTime}</Text>
        <TouchableOpacity style={styles.endRouteButton} onPress={onEndRoute}>
          <Text style={styles.endRouteButtonText}>End Route</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Initial navigation card (before navigation starts)
  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Step {currentStep}/{totalSteps}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <TouchableOpacity onPress={onViewPlaceDetails}>
          <Text style={styles.viewDetailsLink}>View Place Details</Text>
        </TouchableOpacity>
      </View>

      {/* Place Information */}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>
          {quest.placeName || quest.title || 'String value'}
        </Text>
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={16} color="#333" />
          <Text style={styles.address}>
            {quest.placeAddress || 'String value'}
          </Text>
        </View>
      </View>

      {/* Navigate Button */}
      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
        <Text style={styles.navigateButtonText}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    minWidth: 60,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  viewDetailsLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textDecorationLine: 'underline',
  },
  placeInfo: {
    marginBottom: 16,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  navigateButton: {
    backgroundColor: '#E67E22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navigatingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nextStopLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nextStopName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  nextStopDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nextStopWalkTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    marginLeft: 26,
  },
  endRouteButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endRouteButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  completeTaskButton: {
    backgroundColor: '#E67E22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

