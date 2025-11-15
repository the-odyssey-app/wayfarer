/**
 * Unit Tests for Business Logic Functions
 * 
 * Tests for XP calculation, rank determination, distance calculations,
 * and quest validation logic.
 */

import {
  calculateRank,
  getRankName,
  calculateNewXp,
  checkLevelUp,
  calculateQuizXp,
  calculateDistance,
  hasArrived,
  validateStepSequence,
  validateLocation,
  calculateQuizScore,
  isQuizPassed,
  RANK_THRESHOLDS,
} from '../businessLogic';

describe('Rank Calculation', () => {
  describe('calculateRank', () => {
    it('should return rank 1 (New Wayfarer) for 0-199 XP', () => {
      expect(calculateRank(0)).toBe(1);
      expect(calculateRank(50)).toBe(1);
      expect(calculateRank(199)).toBe(1);
    });

    it('should return rank 2 (Junior Journeyman) for 200-499 XP', () => {
      expect(calculateRank(200)).toBe(2);
      expect(calculateRank(350)).toBe(2);
      expect(calculateRank(499)).toBe(2);
    });

    it('should return rank 3 (Adept Adventurer) for 500-999 XP', () => {
      expect(calculateRank(500)).toBe(3);
      expect(calculateRank(750)).toBe(3);
      expect(calculateRank(999)).toBe(3);
    });

    it('should return rank 4 (Expert Explorer) for 1000-1999 XP', () => {
      expect(calculateRank(1000)).toBe(4);
      expect(calculateRank(1500)).toBe(4);
      expect(calculateRank(1999)).toBe(4);
    });

    it('should return rank 5 (Renowned Trailblazer) for 2000+ XP', () => {
      expect(calculateRank(2000)).toBe(5);
      expect(calculateRank(5000)).toBe(5);
      expect(calculateRank(10000)).toBe(5);
    });
  });

  describe('getRankName', () => {
    it('should return correct rank names', () => {
      expect(getRankName(1)).toBe('New Wayfarer');
      expect(getRankName(2)).toBe('Junior Journeyman');
      expect(getRankName(3)).toBe('Adept Adventurer');
      expect(getRankName(4)).toBe('Expert Explorer');
      expect(getRankName(5)).toBe('Renowned Trailblazer');
    });

    it('should default to New Wayfarer for invalid ranks', () => {
      expect(getRankName(0)).toBe('New Wayfarer');
      expect(getRankName(6)).toBe('New Wayfarer');
      expect(getRankName(-1)).toBe('New Wayfarer');
    });
  });
});

describe('XP Calculation', () => {
  describe('calculateNewXp', () => {
    it('should add XP reward to current XP', () => {
      expect(calculateNewXp(100, 25)).toBe(125);
      expect(calculateNewXp(0, 50)).toBe(50);
      expect(calculateNewXp(500, 100)).toBe(600);
    });

    it('should use default reward of 25 if not specified', () => {
      expect(calculateNewXp(100)).toBe(125);
      expect(calculateNewXp(0)).toBe(25);
    });

    it('should handle zero and negative values', () => {
      expect(calculateNewXp(0, 0)).toBe(0);
      expect(calculateNewXp(100, -10)).toBe(90);
    });
  });

  describe('checkLevelUp', () => {
    it('should return true when rank increases', () => {
      // From rank 1 to rank 2 (crossing 200 XP threshold)
      expect(checkLevelUp(1, 200)).toBe(true);
      expect(checkLevelUp(1, 250)).toBe(true);
      
      // From rank 2 to rank 3 (crossing 500 XP threshold)
      expect(checkLevelUp(2, 500)).toBe(true);
      expect(checkLevelUp(2, 600)).toBe(true);
      
      // From rank 3 to rank 4 (crossing 1000 XP threshold)
      expect(checkLevelUp(3, 1000)).toBe(true);
      expect(checkLevelUp(3, 1500)).toBe(true);
      
      // From rank 4 to rank 5 (crossing 2000 XP threshold)
      expect(checkLevelUp(4, 2000)).toBe(true);
      expect(checkLevelUp(4, 5000)).toBe(true);
    });

    it('should return false when rank does not increase', () => {
      // Same rank
      expect(checkLevelUp(1, 100)).toBe(false);
      expect(checkLevelUp(2, 300)).toBe(false);
      expect(checkLevelUp(3, 700)).toBe(false);
      expect(checkLevelUp(4, 1500)).toBe(false);
      expect(checkLevelUp(5, 3000)).toBe(false);
    });

    it('should handle edge cases at rank boundaries', () => {
      // Just below threshold
      expect(checkLevelUp(1, 199)).toBe(false);
      expect(checkLevelUp(2, 499)).toBe(false);
      expect(checkLevelUp(3, 999)).toBe(false);
      expect(checkLevelUp(4, 1999)).toBe(false);
      
      // Exactly at threshold
      expect(checkLevelUp(1, 200)).toBe(true);
      expect(checkLevelUp(2, 500)).toBe(true);
      expect(checkLevelUp(3, 1000)).toBe(true);
      expect(checkLevelUp(4, 2000)).toBe(true);
    });
  });

  describe('calculateQuizXp', () => {
    it('should calculate XP based on correct answers', () => {
      expect(calculateQuizXp(5, 10, 25)).toBe(125); // 5 * 25
      expect(calculateQuizXp(3, 10, 25)).toBe(75);  // 3 * 25
      expect(calculateQuizXp(0, 10, 25)).toBe(0);   // 0 * 25
    });

    it('should apply 50% bonus for perfect score', () => {
      expect(calculateQuizXp(10, 10, 25)).toBe(375); // (10 * 25) * 1.5 = 375
      expect(calculateQuizXp(5, 5, 25)).toBe(187);    // (5 * 25) * 1.5 = 187.5 -> 187 (floor)
      expect(calculateQuizXp(1, 1, 25)).toBe(37);    // (1 * 25) * 1.5 = 37.5 -> 37 (floor)
    });

    it('should use default base XP of 25 if not specified', () => {
      expect(calculateQuizXp(5, 10)).toBe(125); // 5 * 25
      expect(calculateQuizXp(10, 10)).toBe(375); // (10 * 25) * 1.5
    });

    it('should handle edge cases', () => {
      expect(calculateQuizXp(0, 0, 25)).toBe(0);
      expect(calculateQuizXp(10, 10, 0)).toBe(0);
    });
  });
});

describe('Distance Calculations', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // San Francisco to Los Angeles (approximately 559 km)
      const sf = { lat: 37.7749, lon: -122.4194 };
      const la = { lat: 34.0522, lon: -118.2437 };
      const distance = calculateDistance(sf.lat, sf.lon, la.lat, la.lon);
      
      // Should be approximately 559,000 meters (559 km)
      expect(distance).toBeGreaterThan(550000);
      expect(distance).toBeLessThan(570000);
    });

    it('should return 0 for identical coordinates', () => {
      expect(calculateDistance(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
    });

    it('should handle short distances accurately', () => {
      // Two points approximately 100 meters apart (0.001 degree ≈ 111 meters at equator)
      const point1 = { lat: 37.7749, lon: -122.4194 };
      const point2 = { lat: 37.7759, lon: -122.4194 }; // 0.001 degree difference
      const distance = calculateDistance(point1.lat, point1.lon, point2.lat, point2.lon);
      
      // Should be approximately 100 meters (allowing for some variance)
      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeLessThan(200);
    });

    it('should handle coordinates across the equator', () => {
      const north = { lat: 10, lon: 0 };
      const south = { lat: -10, lon: 0 };
      const distance = calculateDistance(north.lat, north.lon, south.lat, south.lon);
      
      // Should be approximately 2,220 km (20 degrees * 111 km/degree)
      expect(distance).toBeGreaterThan(2000000);
      expect(distance).toBeLessThan(2500000);
    });

    it('should handle coordinates across the prime meridian', () => {
      const east = { lat: 0, lon: 10 };
      const west = { lat: 0, lon: -10 };
      const distance = calculateDistance(east.lat, east.lon, west.lat, west.lon);
      
      // Should be approximately 2,220 km
      expect(distance).toBeGreaterThan(2000000);
      expect(distance).toBeLessThan(2500000);
    });
  });

  describe('hasArrived', () => {
    it('should return true when within threshold', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7750, longitude: -122.4194 };
      
      expect(hasArrived(userLocation, destination, 100)).toBe(true);
      expect(hasArrived(userLocation, destination, 200)).toBe(true);
    });

    it('should return false when outside threshold', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7800, longitude: -122.4194 };
      
      expect(hasArrived(userLocation, destination, 50)).toBe(false);
      expect(hasArrived(userLocation, destination, 100)).toBe(false);
    });

    it('should use default threshold of 50 meters', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const destination = { latitude: 37.7750, longitude: -122.4194 };
      
      // Should be within 50m for close points
      expect(hasArrived(userLocation, destination)).toBe(true);
    });

    it('should return true for identical locations', () => {
      const location = { latitude: 37.7749, longitude: -122.4194 };
      expect(hasArrived(location, location, 50)).toBe(true);
    });
  });
});

describe('Quest Validation', () => {
  describe('validateStepSequence', () => {
    it('should return true for valid next step', () => {
      expect(validateStepSequence(0, 1)).toBe(true);
      expect(validateStepSequence(1, 2)).toBe(true);
      expect(validateStepSequence(5, 6)).toBe(true);
    });

    it('should return false for wrong step number', () => {
      expect(validateStepSequence(0, 2)).toBe(false); // Skipping step
      expect(validateStepSequence(1, 1)).toBe(false); // Same step
      expect(validateStepSequence(2, 1)).toBe(false); // Going backwards
      expect(validateStepSequence(5, 3)).toBe(false); // Going backwards
    });

    it('should handle edge cases', () => {
      expect(validateStepSequence(0, 0)).toBe(false);
      expect(validateStepSequence(10, 11)).toBe(true);
    });
  });

  describe('validateLocation', () => {
    it('should validate correct coordinates', () => {
      const result = validateLocation(37.7749, -122.4194);
      expect(result.success).toBe(true);
      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
    });

    it('should reject invalid latitude', () => {
      expect(validateLocation(91, 0).success).toBe(false);
      expect(validateLocation(-91, 0).success).toBe(false);
      expect(validateLocation(100, 0).success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      expect(validateLocation(0, 181).success).toBe(false);
      expect(validateLocation(0, -181).success).toBe(false);
      expect(validateLocation(0, 200).success).toBe(false);
    });

    it('should handle boundary values', () => {
      expect(validateLocation(90, 180).success).toBe(true);
      expect(validateLocation(-90, -180).success).toBe(true);
      expect(validateLocation(0, 0).success).toBe(true);
    });

    it('should parse string coordinates', () => {
      const result = validateLocation(
        parseFloat('37.7749'),
        parseFloat('-122.4194')
      );
      expect(result.success).toBe(true);
      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
    });

    it('should reject NaN values', () => {
      expect(validateLocation(NaN, 0).success).toBe(false);
      expect(validateLocation(0, NaN).success).toBe(false);
      expect(validateLocation(parseFloat('invalid'), 0).success).toBe(false);
    });
  });
});

describe('Quiz Functions', () => {
  describe('calculateQuizScore', () => {
    it('should calculate score percentage correctly', () => {
      expect(calculateQuizScore(5, 10)).toBe(50);
      expect(calculateQuizScore(7, 10)).toBe(70);
      expect(calculateQuizScore(10, 10)).toBe(100);
      expect(calculateQuizScore(0, 10)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculateQuizScore(0, 0)).toBe(0);
      expect(calculateQuizScore(1, 1)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateQuizScore(1, 3)).toBe(33); // 33.33... -> 33
      expect(calculateQuizScore(2, 3)).toBe(67);  // 66.66... -> 67
    });
  });

  describe('isQuizPassed', () => {
    it('should return true for passing scores', () => {
      expect(isQuizPassed(60, 60)).toBe(true);
      expect(isQuizPassed(70, 60)).toBe(true);
      expect(isQuizPassed(100, 60)).toBe(true);
    });

    it('should return false for failing scores', () => {
      expect(isQuizPassed(59, 60)).toBe(false);
      expect(isQuizPassed(50, 60)).toBe(false);
      expect(isQuizPassed(0, 60)).toBe(false);
    });

    it('should use default minimum of 60%', () => {
      expect(isQuizPassed(60)).toBe(true);
      expect(isQuizPassed(59)).toBe(false);
      expect(isQuizPassed(70)).toBe(true);
    });

    it('should handle custom minimum scores', () => {
      expect(isQuizPassed(80, 80)).toBe(true);
      expect(isQuizPassed(79, 80)).toBe(false);
      expect(isQuizPassed(50, 50)).toBe(true);
    });
  });
});

describe('RANK_THRESHOLDS constant', () => {
  it('should have correct threshold values', () => {
    expect(RANK_THRESHOLDS.NEW_WAYFARER.min).toBe(0);
    expect(RANK_THRESHOLDS.NEW_WAYFARER.max).toBe(199);
    expect(RANK_THRESHOLDS.NEW_WAYFARER.rank).toBe(1);

    expect(RANK_THRESHOLDS.JUNIOR_JOURNEYMAN.min).toBe(200);
    expect(RANK_THRESHOLDS.JUNIOR_JOURNEYMAN.max).toBe(499);
    expect(RANK_THRESHOLDS.JUNIOR_JOURNEYMAN.rank).toBe(2);

    expect(RANK_THRESHOLDS.ADEPT_ADVENTURER.min).toBe(500);
    expect(RANK_THRESHOLDS.ADEPT_ADVENTURER.max).toBe(999);
    expect(RANK_THRESHOLDS.ADEPT_ADVENTURER.rank).toBe(3);

    expect(RANK_THRESHOLDS.EXPERT_EXPLORER.min).toBe(1000);
    expect(RANK_THRESHOLDS.EXPERT_EXPLORER.max).toBe(1999);
    expect(RANK_THRESHOLDS.EXPERT_EXPLORER.rank).toBe(4);

    expect(RANK_THRESHOLDS.RENOWNED_TRAILBLAZER.min).toBe(2000);
    expect(RANK_THRESHOLDS.RENOWNED_TRAILBLAZER.max).toBe(Infinity);
    expect(RANK_THRESHOLDS.RENOWNED_TRAILBLAZER.rank).toBe(5);
  });
});

