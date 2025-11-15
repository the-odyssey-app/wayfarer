# Medium Priority Tasks - Detailed Implementation Plan

## Overview
This document details the implementation plan for three medium-priority tasks:
1. **Navigation/Routing Functionality** - Using Mapbox Directions API
2. **Fetch Actual Participants for Quests** - Using Nakama RPCs
3. **Share Functionality** - Using React Native Share API

---

## Task 1: Navigation/Routing Functionality

### Current State
- Mapbox is already integrated (`@rnmapbox/maps`)
- Navigation UI components exist (`NavigationCard`, `TopNavigationCard`)
- Placeholder implementation with simulated arrival (5-second timeout)
- TODO comments at lines 187-188, 207, 304 in `HomeScreen.tsx`

### Requirements
1. Calculate route from user location to quest step destination
2. Display route on map with turn-by-turn directions
3. Monitor user location to detect arrival at destination
4. Update navigation UI with real-time distance and ETA
5. Handle route completion and next step navigation

### Implementation Plan

#### Step 1: Install Required Packages
```bash
cd apps/mobile
npm install @rnmapbox/directions @rnmapbox/navigation
# OR if using Expo:
npx expo install @rnmapbox/directions @rnmapbox/navigation
```

**Reference**: [Mapbox Navigation SDK Documentation](https://docs.mapbox.com/android/navigation/overview/)

#### Step 2: Create Navigation Service
**File**: `apps/mobile/src/services/NavigationService.ts`

```typescript
import { Directions } from '@rnmapbox/directions';
import * as Location from 'expo-location';

interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][]; // [longitude, latitude]
  };
  steps: {
    distance: number;
    duration: number;
    instruction: string;
    maneuver: {
      type: string;
      instruction: string;
    };
  }[];
}

export class NavigationService {
  private static mapboxToken: string;

  static initialize(token: string) {
    this.mapboxToken = token;
  }

  /**
   * Get route from origin to destination using Mapbox Directions API
   * Reference: https://docs.mapbox.com/api/navigation/directions/
   */
  static async getRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    profile: 'walking' | 'cycling' | 'driving' = 'walking'
  ): Promise<RouteResponse | null> {
    try {
      const originCoords = `${origin.longitude},${origin.latitude}`;
      const destCoords = `${destination.longitude},${destination.latitude}`;
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originCoords};${destCoords}?` +
        `access_token=${this.mapboxToken}&` +
        `geometries=geojson&` +
        `steps=true&` +
        `overview=full&` +
        `annotations=distance,duration`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.error('Route calculation failed:', data);
        return null;
      }

      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry.coordinates,
        steps: route.legs[0].steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver.instruction,
          maneuver: {
            type: step.maneuver.type,
            instruction: step.maneuver.instruction,
          },
        })),
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min walk`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m walk`;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if user has arrived at destination (within threshold)
   */
  static hasArrived(
    userLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    thresholdMeters: number = 50
  ): boolean {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      destination.latitude,
      destination.longitude
    );
    return distance <= thresholdMeters;
  }
}
```

#### Step 3: Update MapComponent to Display Route
**File**: `apps/mobile/src/components/MapComponent.tsx`

Add route line source and layer:

```typescript
// Add state for route
const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

// Add route line source
<Mapbox.ShapeSource id="route" shape={routeLineString}>
  <Mapbox.LineLayer
    id="routeLine"
    style={{
      lineColor: '#17B2B2',
      lineWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
    }}
  />
</Mapbox.ShapeSource>

// Helper to create GeoJSON LineString
const routeLineString = routeCoordinates.length > 0 ? {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: routeCoordinates,
  },
} : null;
```

#### Step 4: Update HomeScreen Navigation Logic
**File**: `apps/mobile/src/screens/HomeScreen.tsx`

Replace `handleNavigate()` function (lines 183-193):

```typescript
const handleNavigate = async () => {
  if (!currentLocation || !joinedQuest) {
    Alert.alert('Error', 'Location or quest information not available');
    return;
  }

  try {
    // Get current quest step details
    const questDetail = await callRpc('get_quest_detail', { 
      questId: joinedQuest.id 
    });

    if (!questDetail.success || !questDetail.quest) {
      Alert.alert('Error', 'Could not load quest steps');
      return;
    }

    const currentStep = questDetail.quest.steps?.find(
      (step: any) => step.step_number === questProgress.currentStep
    );

    if (!currentStep || !currentStep.latitude || !currentStep.longitude) {
      Alert.alert('Error', 'Current step location not found');
      return;
    }

    // Calculate route using NavigationService
    const route = await NavigationService.getRoute(
      { latitude: currentLocation.lat, longitude: currentLocation.lng },
      { latitude: currentStep.latitude, longitude: currentStep.longitude },
      'walking'
    );

    if (!route) {
      Alert.alert('Error', 'Could not calculate route');
      return;
    }

    // Update navigation state
    setIsNavigating(true);
    setHasArrived(false);
    
    // Update navigation data
    setNavigationData({
      destination: currentStep.place_name || currentStep.description || 'Destination',
      distance: NavigationService.formatDistance(route.distance),
      walkTime: NavigationService.formatDuration(route.duration),
      route: route.steps[0]?.maneuver?.instruction || 'Route',
    });

    setNextStop({
      name: currentStep.place_name || 'Next Stop',
      distance: NavigationService.formatDistance(route.distance),
      walkTime: NavigationService.formatDuration(route.duration),
    });

    // Set route coordinates for map display
    // (Pass to MapComponent via props or context)

    // Start location monitoring
    startLocationMonitoring(
      { latitude: currentLocation.lat, longitude: currentLocation.lng },
      { latitude: currentStep.latitude, longitude: currentStep.longitude }
    );
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert('Error', 'Failed to start navigation');
  }
};

// Add location monitoring function
const startLocationMonitoring = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) => {
  const locationInterval = setInterval(async () => {
    try {
      const currentPos = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: currentPos.coords.latitude,
        longitude: currentPos.coords.longitude,
      };

      // Update current location
      setCurrentLocation({ lat: userLoc.latitude, lng: userLoc.longitude });

      // Check if arrived
      if (NavigationService.hasArrived(userLoc, destination, 50)) {
        clearInterval(locationInterval);
        setHasArrived(true);
        setIsNavigating(false);
        Alert.alert('Arrived!', 'You have reached your destination');
      } else {
        // Update distance to destination
        const distance = NavigationService.calculateDistance(
          userLoc.latitude,
          userLoc.longitude,
          destination.latitude,
          destination.longitude
        );
        setNextStop(prev => ({
          ...prev,
          distance: NavigationService.formatDistance(distance),
        }));
      }
    } catch (error) {
      console.error('Location monitoring error:', error);
    }
  }, 5000); // Check every 5 seconds

  // Store interval ID for cleanup
  return locationInterval;
};
```

Update `handleEndRoute()` (lines 195-212):

```typescript
const handleEndRoute = () => {
  Alert.alert(
    'End Route',
    'Are you sure you want to end navigation?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Route',
        style: 'destructive',
        onPress: () => {
          setIsNavigating(false);
          setHasArrived(false);
          // Clear route from map
          setRouteCoordinates([]);
          // Stop location monitoring
          if (locationMonitoringInterval) {
            clearInterval(locationMonitoringInterval);
          }
        },
      },
    ]
  );
};
```

Update next step navigation (line 304):

```typescript
// After completing a step, navigate to next step
const handleNextStep = async () => {
  if (!joinedQuest) return;

  const nextStepNumber = questProgress.currentStep + 1;
  if (nextStepNumber > questProgress.totalSteps) {
    // Quest complete
    return;
  }

  // Get next step location
  const questDetail = await callRpc('get_quest_detail', { 
    questId: joinedQuest.id 
  });
  
  const nextStep = questDetail.quest.steps?.find(
    (step: any) => step.step_number === nextStepNumber
  );

  if (nextStep && nextStep.latitude && nextStep.longitude) {
    // Start navigation to next step
    await handleNavigate();
  }
};
```

#### Step 5: Environment Configuration
Add Mapbox token to environment/config:
- Ensure `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- Or configure in `app.json` under `extra.mapboxAccessToken`

**Reference**: [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)

---

## Task 2: Fetch Actual Participants for Quests

### Current State
- Hardcoded empty array: `participants={[]}` at line 766
- `totalParticipants` state is manually set (line 73)
- TODO comment at line 766

### Requirements
1. Fetch actual participants from Nakama backend
2. Display participant count in UI
3. Show participant list in quest detail/organize quest screen

### Implementation Plan

#### Step 1: Check Available Nakama RPCs
**Reference**: [Nakama JavaScript Client Documentation](https://heroiclabs.com/docs/nakama/client-libraries/javascript/)

Available RPCs to check:
- `get_quest_detail` - May include participants
- `get_party_members` - For party-based quests
- Custom RPC may be needed: `get_quest_participants`

#### Step 2: Create/Verify Backend RPC
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

If RPC doesn't exist, add:

```javascript
function rpcGetQuestParticipants(ctx, logger, nk, payload) {
  try {
    if (utils) {
      const auth = utils.requireAuth(ctx, logger);
      if (!auth.success) {
        return utils.errorResponse(auth.error, auth.code);
      }
      const userId = auth.userId;
      
      const parseResult = utils.parsePayload(payload, logger);
      if (!parseResult.success) {
        return utils.errorResponse(parseResult.error, parseResult.code);
      }
      const data = parseResult.data;
      const { quest_id } = data;
      
      if (!quest_id) {
        return utils.errorResponse('quest_id is required', 'VALIDATION_ERROR');
      }
      
      // Query participants from user_quests table
      const query = `
        SELECT 
          uq.user_id,
          u.username,
          up.avatar_url,
          up.level,
          uq.status,
          uq.started_at
        FROM user_quests uq
        JOIN users u ON uq.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE uq.quest_id = $1
        ORDER BY uq.started_at ASC
      `;
      
      const participants = nk.sqlQuery(query, [quest_id]);
      
      return utils.successResponse({
        participants: participants || [],
        count: participants?.length || 0
      });
    }
    
    // Fallback implementation
    const userId = ctx.userId;
    if (!userId) {
      return JSON.stringify({ success: false, error: 'User not authenticated' });
    }
    
    let data;
    try {
      data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (e) {
      return JSON.stringify({ success: false, error: 'Invalid payload' });
    }
    
    const { quest_id } = data;
    if (!quest_id) {
      return JSON.stringify({ success: false, error: 'quest_id is required' });
    }
    
    const query = `
      SELECT 
        uq.user_id,
        u.username,
        up.avatar_url,
        up.level,
        uq.status,
        uq.started_at
      FROM user_quests uq
      JOIN users u ON uq.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE uq.quest_id = $1
      ORDER BY uq.started_at ASC
    `;
    
    const participants = nk.sqlQuery(query, [quest_id]);
    
    return JSON.stringify({
      success: true,
      participants: participants || [],
      count: participants?.length || 0
    });
  } catch (error) {
    if (utils) {
      return utils.handleError(error, logger, 'rpcGetQuestParticipants');
    }
    logger.error(`Error getting quest participants: ${error}`);
    return JSON.stringify({ success: false, error: error.message || 'Internal server error' });
  }
}
```

Register in `InitModule`:
```javascript
initializer.registerRpc('get_quest_participants', rpcGetQuestParticipants);
```

#### Step 3: Update HomeScreen to Fetch Participants
**File**: `apps/mobile/src/screens/HomeScreen.tsx`

Add state for participants:
```typescript
const [questParticipants, setQuestParticipants] = useState<any[]>([]);
const [loadingParticipants, setLoadingParticipants] = useState(false);
```

Add function to fetch participants:
```typescript
const fetchQuestParticipants = async (questId: string) => {
  try {
    setLoadingParticipants(true);
    const result = await callRpc('get_quest_participants', { quest_id: questId });
    
    if (result.success) {
      setQuestParticipants(result.participants || []);
      setTotalParticipants(result.count.toString());
    } else {
      console.error('Failed to fetch participants:', result.error);
      setQuestParticipants([]);
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
    setQuestParticipants([]);
  } finally {
    setLoadingParticipants(false);
  }
};
```

Update where participants are used (line 766):
```typescript
// Replace hardcoded participants={[]} with:
participants={questParticipants}
```

Add useEffect to fetch when quest is selected:
```typescript
useEffect(() => {
  if (selectedPrivateQuest?.id) {
    fetchQuestParticipants(selectedPrivateQuest.id);
  }
}, [selectedPrivateQuest?.id]);
```

#### Step 4: Update Organize Quest Screen
**File**: `apps/mobile/src/screens/HomeScreen.tsx` (Organize Quest Modal section)

Replace manual input with fetched data:
```typescript
// Instead of TextInput for totalParticipants, show actual count
<View style={styles.participantCountContainer}>
  <Text style={styles.organizeQuestLabel}>Total Participants</Text>
  <Text style={styles.participantCount}>
    {questParticipants.length} {questParticipants.length === 1 ? 'person' : 'people'}
  </Text>
  {loadingParticipants && <ActivityIndicator size="small" />}
</View>

// Show participant list
{questParticipants.length > 0 && (
  <View style={styles.participantsList}>
    <Text style={styles.participantsListTitle}>Participants</Text>
    {questParticipants.map((participant) => (
      <View key={participant.user_id} style={styles.participantItem}>
        <Text>{participant.username}</Text>
        {participant.level && (
          <Text style={styles.participantLevel}>Level {participant.level}</Text>
        )}
      </View>
    ))}
  </View>
)}
```

**Reference**: [Nakama RPC Documentation](https://heroiclabs.com/docs/nakama/client-libraries/javascript/#remote-procedure-calls)

---

## Task 3: Share Functionality

### Current State
- Share button shows alert at line 323-324
- TODO comment: "Implement share functionality"
- React Native Share API is already imported in some screens

### Requirements
1. Share quest details
2. Share achievements
3. Share quest completion
4. Share user profile/level

### Implementation Plan

#### Step 1: Create Share Service
**File**: `apps/mobile/src/services/ShareService.ts`

```typescript
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
}
```

#### Step 2: Update HomeScreen Share Button
**File**: `apps/mobile/src/screens/HomeScreen.tsx`

Replace `handleShareAchievement()` (lines 322-325):

```typescript
const handleShareAchievement = async () => {
  if (completedQuestData) {
    await ShareService.shareQuestCompletion({
      title: completedQuestData.questTitle,
      xpReward: completedQuestData.xpReward,
      completedAt: new Date().toISOString(),
    });
  } else {
    Alert.alert('Share', 'No achievement to share');
  }
};
```

#### Step 3: Add Share Buttons to Other Screens

**QuestDetailScreen.tsx**:
```typescript
import { ShareService } from '../services/ShareService';

const handleShareQuest = async () => {
  await ShareService.shareQuest({
    id: quest.id,
    title: quest.title,
    description: quest.description,
  });
};
```

**AchievementsScreen.tsx**:
```typescript
const handleShareAchievement = async (achievement: any) => {
  await ShareService.shareAchievement({
    title: achievement.title,
    description: achievement.description,
    xp: achievement.xp_reward,
  });
};
```

**ProfileScreen.tsx**:
```typescript
const handleShareProfile = async () => {
  await ShareService.shareProfile({
    username: username,
    level: userLevel,
    xp: currentXP,
  });
};
```

**Reference**: [React Native Share API](https://reactnative.dev/docs/share)

---

## Implementation Timeline

### Phase 1: Navigation (Week 1)
- Day 1-2: Install packages, create NavigationService
- Day 3-4: Update MapComponent with route display
- Day 5: Update HomeScreen navigation logic
- Day 6-7: Testing and bug fixes

### Phase 2: Participants (Week 2)
- Day 1: Create/verify backend RPC
- Day 2: Update HomeScreen to fetch participants
- Day 3: Update UI to display participants
- Day 4: Testing

### Phase 3: Share Functionality (Week 2)
- Day 1: Create ShareService
- Day 2: Update HomeScreen share button
- Day 3: Add share to other screens
- Day 4: Testing

---

## Dependencies

### New npm Packages
```json
{
  "@rnmapbox/directions": "^1.0.0",
  "@rnmapbox/navigation": "^1.0.0"
}
```

### Environment Variables
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` - Required for Mapbox Directions API

### Backend Requirements
- RPC: `get_quest_participants` (may need to be created)
- Database: `user_quests` table must exist with proper schema

---

## Testing Checklist

### Navigation
- [ ] Route calculation works for walking profile
- [ ] Route displays correctly on map
- [ ] Distance and ETA update correctly
- [ ] Arrival detection works within 50m threshold
- [ ] Next step navigation works
- [ ] Route cancellation works

### Participants
- [ ] Participants fetch correctly for quest
- [ ] Participant count displays correctly
- [ ] Participant list shows in organize quest screen
- [ ] Handles empty participants gracefully
- [ ] Updates when new participants join

### Share
- [ ] Quest sharing works
- [ ] Achievement sharing works
- [ ] Quest completion sharing works
- [ ] Profile sharing works
- [ ] Error handling works (user cancels share)

---

## References

1. [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
2. [Mapbox Navigation SDK](https://docs.mapbox.com/android/navigation/overview/)
3. [Nakama JavaScript Client](https://heroiclabs.com/docs/nakama/client-libraries/javascript/)
4. [Nakama RPC Documentation](https://heroiclabs.com/docs/nakama/client-libraries/javascript/#remote-procedure-calls)
5. [React Native Share API](https://reactnative.dev/docs/share)

