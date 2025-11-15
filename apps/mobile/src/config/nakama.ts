import { Client } from '@heroiclabs/nakama-js';
import Constants from 'expo-constants';

// Get Nakama configuration from environment variables
// Set these in app.json or via EXPO_PUBLIC_* environment variables
const getNakamaConfig = () => {
  const env = Constants.expoConfig?.extra?.env || process.env.EXPO_PUBLIC_ENV || 'development';
  
  // Production uses remote server from environment
  if (env === 'production') {
    return {
      host: Constants.expoConfig?.extra?.nakamaHost || 
            process.env.EXPO_PUBLIC_NAKAMA_HOST || 
            '5.181.218.160', // Fallback for backward compatibility
      port: parseInt(
        Constants.expoConfig?.extra?.nakamaPort || 
        process.env.EXPO_PUBLIC_NAKAMA_PORT || 
        '7350'
      ),
      useSSL: Constants.expoConfig?.extra?.nakamaUseSSL === 'true' || 
              process.env.EXPO_PUBLIC_NAKAMA_USE_SSL === 'true' || 
              false,
    };
  }
  
  // Development defaults to localhost
  return {
    host: Constants.expoConfig?.extra?.nakamaHost || 
          process.env.EXPO_PUBLIC_NAKAMA_HOST || 
          'localhost',
    port: parseInt(
      Constants.expoConfig?.extra?.nakamaPort || 
      process.env.EXPO_PUBLIC_NAKAMA_PORT || 
      '7350'
    ),
    useSSL: false,
  };
};

// Nakama configuration
export const NAKAMA_CONFIG = {
  ...getNakamaConfig(),
  serverKey: Constants.expoConfig?.extra?.nakamaServerKey || 
             process.env.EXPO_PUBLIC_NAKAMA_SERVER_KEY || 
             'defaultkey',
  timeout: 10000, // 10 seconds
};

// Debug logging to diagnose configuration issues
console.log('🔍 Nakama Config Debug:', {
  env: Constants.expoConfig?.extra?.env || process.env.EXPO_PUBLIC_ENV || 'development',
  host: NAKAMA_CONFIG.host,
  port: NAKAMA_CONFIG.port,
  useSSL: NAKAMA_CONFIG.useSSL,
  serverKey: NAKAMA_CONFIG.serverKey,
  timeout: NAKAMA_CONFIG.timeout,
  expoConfigExtra: Constants.expoConfig?.extra,
  fullConfig: NAKAMA_CONFIG
});

// Alternative hosts for different environments
export const NAKAMA_HOSTS = {
  android_emulator: '10.0.2.2',
  ios_simulator: 'localhost', // iOS simulator can access localhost
  physical_device: NAKAMA_CONFIG.host, // Use configured host
};

// Create Nakama client instance
export const nakamaClient = new Client(
  NAKAMA_CONFIG.serverKey,
  NAKAMA_CONFIG.host,
  NAKAMA_CONFIG.port.toString(),
  NAKAMA_CONFIG.useSSL,
  NAKAMA_CONFIG.timeout
);

// Debug: Log client creation
console.log('🔍 Nakama Client Created:', {
  serverKey: NAKAMA_CONFIG.serverKey,
  host: NAKAMA_CONFIG.host,
  port: NAKAMA_CONFIG.port.toString(),
  useSSL: NAKAMA_CONFIG.useSSL,
  timeout: NAKAMA_CONFIG.timeout,
  clientUrl: `${NAKAMA_CONFIG.useSSL ? 'https' : 'http'}://${NAKAMA_CONFIG.host}:${NAKAMA_CONFIG.port}`
});

// Nakama session management
export interface NakamaSession {
  session: any;
  userId: string;
  username: string;
  isAuthenticated: boolean;
}

// Session storage key
export const NAKAMA_SESSION_KEY = 'nakama_session';

// Helper function to create session with Nakama
export const createNakamaSession = async (
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
    // Session restoration not implemented in alpha
    throw new Error('Session restoration not implemented in alpha');
  } catch (error) {
    console.error('Failed to restore Nakama session:', error);
    throw new Error('Failed to restore Nakama session');
  }
};

// Helper function to disconnect from Nakama
export const disconnectNakama = async (): Promise<void> => {
  try {
    // Disconnection not implemented in alpha
  } catch (error) {
    console.error('Failed to disconnect from Nakama:', error);
  }
};
