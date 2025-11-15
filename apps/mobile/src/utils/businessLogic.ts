/**
 * Business Logic Utilities for Wayfarer
 * 
 * Extracted pure functions from RPC implementations for testability.
 * These functions contain the core business logic for XP, ranks, and quest validation.
 */

/**
 * Rank thresholds for the Wayfarer progression system
 * Based on total XP accumulated:
 * - Rank 1 (New Wayfarer): 0-199 XP
 * - Rank 2 (Junior Journeyman): 200-499 XP
 * - Rank 3 (Adept Adventurer): 500-999 XP
 * - Rank 4 (Expert Explorer): 1000-1999 XP
 * - Rank 5 (Renowned Trailblazer): 2000+ XP
 */
export const RANK_THRESHOLDS = {
  NEW_WAYFARER: { min: 0, max: 199, rank: 1, name: 'New Wayfarer' },
  JUNIOR_JOURNEYMAN: { min: 200, max: 499, rank: 2, name: 'Junior Journeyman' },
  ADEPT_ADVENTURER: { min: 500, max: 999, rank: 3, name: 'Adept Adventurer' },
  EXPERT_EXPLORER: { min: 1000, max: 1999, rank: 4, name: 'Expert Explorer' },
  RENOWNED_TRAILBLAZER: { min: 2000, max: Infinity, rank: 5, name: 'Renowned Trailblazer' },
} as const;

/**
 * Calculate user rank based on total XP
 * @param totalXp - Total experience points accumulated
 * @returns Rank number (1-5)
 */
export function calculateRank(totalXp: number): number {
  if (totalXp >= 2000) return 5; // Renowned Trailblazer
  if (totalXp >= 1000) return 4; // Expert Explorer
  if (totalXp >= 500) return 3;  // Adept Adventurer
  if (totalXp >= 200) return 2;  // Junior Journeyman
  return 1; // New Wayfarer
}

/**
 * Get rank name from rank number
 * @param rank - Rank number (1-5)
 * @returns Rank name string
 */
export function getRankName(rank: number): string {
  switch (rank) {
    case 5:
      return RANK_THRESHOLDS.RENOWNED_TRAILBLAZER.name;
    case 4:
      return RANK_THRESHOLDS.EXPERT_EXPLORER.name;
    case 3:
      return RANK_THRESHOLDS.ADEPT_ADVENTURER.name;
    case 2:
      return RANK_THRESHOLDS.JUNIOR_JOURNEYMAN.name;
    case 1:
    default:
      return RANK_THRESHOLDS.NEW_WAYFARER.name;
  }
}

/**
 * Calculate new XP after awarding reward
 * @param currentXp - Current total XP
 * @param xpReward - XP to award (default: 25)
 * @returns New total XP
 */
export function calculateNewXp(currentXp: number, xpReward: number = 25): number {
  return currentXp + xpReward;
}

/**
 * Check if user leveled up after XP award
 * @param currentRank - Current rank before XP award
 * @param newXp - New total XP after award
 * @returns True if rank increased
 */
export function checkLevelUp(currentRank: number, newXp: number): boolean {
  const newRank = calculateRank(newXp);
  return newRank > currentRank;
}

/**
 * Calculate XP reward for quiz completion
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @param baseXpPerQuestion - Base XP per question (default: 25)
 * @returns Total XP earned
 */
export function calculateQuizXp(
  correctAnswers: number,
  totalQuestions: number,
  baseXpPerQuestion: number = 25
): number {
  let xpEarned = correctAnswers * baseXpPerQuestion;
  
  // 50% bonus for perfect score
  if (correctAnswers === totalQuestions && totalQuestions > 0) {
    xpEarned = Math.floor(xpEarned * 1.5);
  }
  
  return xpEarned;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if user has arrived at destination (within threshold)
 * @param userLocation - User's current location
 * @param destination - Destination location
 * @param thresholdMeters - Distance threshold in meters (default: 50)
 * @returns True if user is within threshold
 */
export function hasArrived(
  userLocation: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  thresholdMeters: number = 50
): boolean {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    destination.latitude,
    destination.longitude
  );
  return distance <= thresholdMeters;
}

/**
 * Validate quest step completion requirements
 * @param currentStepNumber - Current step number user is on
 * @param stepNumber - Step number being completed
 * @returns True if step can be completed (is the next step)
 */
export function validateStepSequence(
  currentStepNumber: number,
  stepNumber: number
): boolean {
  // User should be on step N-1 to complete step N
  return stepNumber === currentStepNumber + 1;
}

/**
 * Validate location coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns Object with success status and validated coordinates or error
 */
export function validateLocation(
  latitude: number,
  longitude: number
): { success: boolean; latitude?: number; longitude?: number; error?: string } {
  const lat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude));
  const lng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude));

  if (isNaN(lat) || isNaN(lng)) {
    return {
      success: false,
      error: 'Invalid location coordinates',
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      success: false,
      error: 'Location coordinates out of valid range',
    };
  }

  return { success: true, latitude: lat, longitude: lng };
}

/**
 * Calculate quiz score percentage
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @returns Score percentage (0-100)
 */
export function calculateQuizScore(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

/**
 * Check if quiz was passed
 * @param scorePercent - Score percentage (0-100)
 * @param minScorePercent - Minimum required score (default: 60)
 * @returns True if quiz was passed
 */
export function isQuizPassed(scorePercent: number, minScorePercent: number = 60): boolean {
  return scorePercent >= minScorePercent;
}

