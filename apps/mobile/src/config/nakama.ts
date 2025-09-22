import { Client } from '@heroiclabs/nakama-js';

// Nakama configuration
export const NAKAMA_CONFIG = {
  host: 'nakama-demo.heroiclabs.com', // Public test server
  port: 7350,
  useSSL: false, // Try HTTP first to test connectivity
  serverKey: 'defaultkey', // Default development key
  timeout: 10000, // 10 seconds
};

// Alternative hosts for different environments
export const NAKAMA_HOSTS = {
  android_emulator: '10.0.2.2',
  ios_simulator: 'localhost', // iOS simulator can access localhost
  physical_device: '5.181.218.160', // VPS IP address
};

// Create Nakama client instance
export const nakamaClient = new Client(
  NAKAMA_CONFIG.serverKey,
  NAKAMA_CONFIG.host,
  NAKAMA_CONFIG.port.toString(),
  NAKAMA_CONFIG.useSSL,
  NAKAMA_CONFIG.timeout
);

// Nakama session management
export interface NakamaSession {
  session: any;
  userId: string;
  username: string;
  isAuthenticated: boolean;
}

// Session storage key
export const NAKAMA_SESSION_KEY = 'nakama_session';

// Helper function to create session from Convex user data
export const createNakamaSession = async (
  convexUserId: string,
  username: string,
  email: string
): Promise<NakamaSession> => {
  try {
    // Authenticate with Nakama using email/password
    // For alpha, we'll use email as both username and password
    const session = await nakamaClient.authenticateEmail(email, email, true, username);
    
    return {
      session,
      userId: session.user_id || '',
      username: session.username || '',
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Failed to create Nakama session:', error);
    throw new Error('Failed to authenticate with Nakama');
  }
};

// Helper function to restore session from stored data
export const restoreNakamaSession = async (sessionData: any): Promise<NakamaSession> => {
  try {
    // For now, we'll skip session restoration in alpha
    // In production, you'd implement proper session restoration
    throw new Error('Session restoration not implemented in alpha');
  } catch (error) {
    console.error('Failed to restore Nakama session:', error);
    throw new Error('Failed to restore Nakama session');
  }
};

// Helper function to disconnect from Nakama
export const disconnectNakama = async (): Promise<void> => {
  try {
    // For now, we'll skip disconnection in alpha
    // In production, you'd implement proper disconnection
    console.log('Nakama disconnection not implemented in alpha');
  } catch (error) {
    console.error('Failed to disconnect from Nakama:', error);
  }
};
