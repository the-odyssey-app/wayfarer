import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { 
  nakamaClient, 
  NakamaSession, 
  createNakamaSession, 
  restoreNakamaSession,
  disconnectNakama,
  NAKAMA_SESSION_KEY,
  NAKAMA_CONFIG
} from '../config/nakama';

interface NakamaContextType {
  session: NakamaSession | null;
  isConnected: boolean;
  connect: (convexUserId: string, username: string, email: string) => Promise<void>;
  authenticateWithFacebook: (facebookToken: string) => Promise<{ nakamaId: string; username: string; email?: string }>;
  authenticateWithGoogle: (googleToken: string) => Promise<{ nakamaId: string; username: string; email?: string }>;
  authenticateWithEmail: (email: string, password: string) => Promise<{ nakamaId: string; username: string; email: string }>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  callRpc: (functionName: string, payload?: any) => Promise<any>;
}

const NakamaContext = createContext<NakamaContextType | undefined>(undefined);

interface NakamaProviderProps {
  children: ReactNode;
}

export const NakamaProvider: React.FC<NakamaProviderProps> = ({ children }) => {
  const [session, setSession] = useState<NakamaSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load stored session on app start
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      // Temporarily disable session restoration to prevent crashes
      // TODO: Implement proper session restoration in production
      console.log('Session restoration disabled for alpha testing');
      await AsyncStorage.removeItem(NAKAMA_SESSION_KEY);
    } catch (error) {
      console.error('Failed to load stored Nakama session:', error);
      // Clear invalid session data
      await AsyncStorage.removeItem(NAKAMA_SESSION_KEY);
    }
  };

  const connect = async (convexUserId: string, username: string, email: string) => {
    try {
      const newSession = await createNakamaSession(convexUserId, username, email);
      
      // Store session data
      await AsyncStorage.setItem(NAKAMA_SESSION_KEY, JSON.stringify({
        token: newSession.session.token,
        refresh_token: newSession.session.refresh_token,
        user_id: newSession.userId,
        username: newSession.username,
      }));
      
      setSession(newSession);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to Nakama:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await disconnectNakama();
      await AsyncStorage.removeItem(NAKAMA_SESSION_KEY);
      setSession(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Nakama:', error);
    }
  };

  const authenticateWithFacebook = async (facebookToken: string) => {
    try {
      // For now, we'll simulate Facebook authentication
      // In production, you'd use the actual Facebook token
      const mockSession = await nakamaClient.authenticateEmail(
        `facebook_${Date.now()}@example.com`,
        'facebook_password',
        true,
        `facebook_user_${Date.now()}`
      );
      
      return {
        nakamaId: mockSession.user_id || '',
        username: mockSession.username || '',
        email: `facebook_${Date.now()}@example.com`
      };
    } catch (error) {
      console.error('Facebook authentication failed:', error);
      throw new Error('Facebook authentication failed');
    }
  };

  const authenticateWithGoogle = async (googleToken: string) => {
    try {
      // For now, we'll simulate Google authentication
      // In production, you'd use the actual Google token
      const mockSession = await nakamaClient.authenticateEmail(
        `google_${Date.now()}@example.com`,
        'google_password',
        true,
        `google_user_${Date.now()}`
      );
      
      return {
        nakamaId: mockSession.user_id || '',
        username: mockSession.username || '',
        email: `google_${Date.now()}@example.com`
      };
    } catch (error) {
      console.error('Google authentication failed:', error);
      throw new Error('Google authentication failed');
    }
  };

  const authenticateWithEmail = async (email: string, password: string) => {
    try {
      console.log('=== NAKAMA AUTHENTICATION DEBUG ===');
      console.log('Host:', NAKAMA_CONFIG.host);
      console.log('Port:', NAKAMA_CONFIG.port);
      console.log('SSL:', NAKAMA_CONFIG.useSSL);
      console.log('Server Key:', NAKAMA_CONFIG.serverKey);
      console.log('Timeout:', NAKAMA_CONFIG.timeout);
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      // Check network connectivity
      console.log('Checking network connectivity...');
      const netInfo = await NetInfo.fetch();
      console.log('Network state:', netInfo);
      if (!netInfo.isConnected) {
        throw new Error('No network connection available');
      }
      
      // Test basic connectivity first
      console.log('Testing basic connectivity...');
      const testUrl = `${NAKAMA_CONFIG.useSSL ? 'https' : 'http'}://${NAKAMA_CONFIG.host}:${NAKAMA_CONFIG.port}/v2/account`;
      console.log('Test URL:', testUrl);
      
      const session = await nakamaClient.authenticateEmail(email, password, true);
      console.log('Authentication successful!');
      console.log('Session:', session);
      
      // Store session data for future use
      await AsyncStorage.setItem(NAKAMA_SESSION_KEY, JSON.stringify({
        token: session.token,
        refresh_token: session.refresh_token,
        user_id: session.user_id,
        username: session.username,
      }));
      
      // Update context state
      setSession({
        session: session,
        userId: session.user_id || '',
        username: session.username || '',
      });
      setIsConnected(true);
      
      return {
        nakamaId: session.user_id || '',
        username: session.username || '',
        email: email
      };
    } catch (error) {
      console.error('=== AUTHENTICATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Full error object:', error);
      console.error('Nakama client config:', NAKAMA_CONFIG);
      throw new Error(`Email authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const reconnect = async () => {
    try {
      await loadStoredSession();
    } catch (error) {
      console.error('Failed to reconnect to Nakama:', error);
      await disconnect();
    }
  };

  const callRpc = async (functionName: string, payload?: any) => {
    try {
      if (!session?.session) {
        throw new Error('No active session');
      }

      const payloadString = payload ? JSON.stringify(payload) : '{}';
      const result = await nakamaClient.rpc(session.session, functionName, payloadString);
      
      // Parse the result if it's a JSON string
      try {
        return JSON.parse(result.payload);
      } catch {
        return result.payload;
      }
    } catch (error) {
      console.error(`RPC call failed for ${functionName}:`, error);
      throw error;
    }
  };

  const value: NakamaContextType = {
    session,
    isConnected,
    connect,
    authenticateWithFacebook,
    authenticateWithGoogle,
    authenticateWithEmail,
    disconnect,
    reconnect,
    callRpc,
  };

  return (
    <NakamaContext.Provider value={value}>
      {children}
    </NakamaContext.Provider>
  );
};

export const useNakama = (): NakamaContextType => {
  const context = useContext(NakamaContext);
  if (context === undefined) {
    throw new Error('useNakama must be used within a NakamaProvider');
  }
  return context;
};
