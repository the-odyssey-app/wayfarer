/**
 * Unit Tests for NavigationService
 * 
 * Tests for distance calculations and arrival detection.
 */

import { NavigationService } from '../NavigationService';

describe('NavigationService', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // San Francisco to Los Angeles (approximately 559 km)
      const distance = NavigationService.calculateDistance(
        37.7749, -122.4194, // SF
        34.0522, -118.2437  // LA
      );
      
      // Should be approximately 559,000 meters (559 km)
      expect(distance).toBeGreaterThan(550000);
      expect(distance).toBeLessThan(570000);
    });

    it('should return 0 for identical coordinates', () => {
      const distance = NavigationService.calculateDistance(
        37.7749, -122.4194,
        37.7749, -122.4194
      );
      expect(distance).toBe(0);
    });

    it('should handle short distances accurately', () => {
      // Two points approximately 100 meters apart (0.001 degree ≈ 111 meters at equator)
      const distance = NavigationService.calculateDistance(
        37.7749, -122.4194,
        37.7759, -122.4194 // 0.001 degree difference
      );
      
      // Should be approximately 100 meters (allowing for some variance)
      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeLessThan(200);
    });
  });

  describe('hasArrived', () => {
    it('should return true when within threshold', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7750, longitude: -122.4194 };
      
      expect(NavigationService.hasArrived(userLocation, destination, 100)).toBe(true);
      expect(NavigationService.hasArrived(userLocation, destination, 200)).toBe(true);
    });

    it('should return false when outside threshold', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7800, longitude: -122.4194 };
      
      expect(NavigationService.hasArrived(userLocation, destination, 50)).toBe(false);
      expect(NavigationService.hasArrived(userLocation, destination, 100)).toBe(false);
    });

    it('should use default threshold of 50 meters', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7750, longitude: -122.4194 };
      
      // Should be within 50m for close points
      expect(NavigationService.hasArrived(userLocation, destination)).toBe(true);
    });

    it('should return true for identical locations', () => {
      const location = { latitude: 37.7749, longitude: -122.4194 };
      expect(NavigationService.hasArrived(location, location, 50)).toBe(true);
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1000m in feet', () => {
      expect(NavigationService.formatDistance(500)).toContain('ft');
      expect(NavigationService.formatDistance(999)).toContain('ft');
    });

    it('should format distances greater than 1000m in kilometers', () => {
      const result = NavigationService.formatDistance(5000);
      expect(result).toContain('km');
      expect(parseFloat(result)).toBeCloseTo(5.0, 1);
    });

    it('should handle zero distance', () => {
      expect(NavigationService.formatDistance(0)).toContain('ft');
    });
  });

  describe('formatDuration', () => {
    it('should format durations less than 60 minutes', () => {
      const result = NavigationService.formatDuration(1800); // 30 minutes
      expect(result).toContain('min');
      expect(result).toContain('walk');
    });

    it('should format durations greater than 60 minutes', () => {
      const result = NavigationService.formatDuration(7200); // 2 hours
      expect(result).toContain('h');
      expect(result).toContain('m');
      expect(result).toContain('walk');
    });

    it('should handle zero duration', () => {
      const result = NavigationService.formatDuration(0);
      expect(result).toContain('min');
    });
  });
});

