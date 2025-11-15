import * as Location from 'expo-location';
import Constants from 'expo-constants';

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
  private static mapboxToken: string | null = null;

  static initialize(token?: string) {
    this.mapboxToken = token || 
      Constants.expoConfig?.extra?.mapboxAccessToken || 
      Constants.expoConfig?.mapboxAccessToken ||
      process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      null;
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
      if (!this.mapboxToken) {
        this.initialize();
        if (!this.mapboxToken) {
          console.error('Mapbox token not configured');
          return null;
        }
      }

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
      return `${Math.round(meters)} ft`;
    }
    const km = meters / 1000;
    if (km < 1) {
      return `${Math.round(meters)} ft`;
    }
    return `${km.toFixed(1)} km`;
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

