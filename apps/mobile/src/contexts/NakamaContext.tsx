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
  connect: (username: string, email: string) => Promise<void>;
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
      // Session restoration disabled for alpha testing
      await AsyncStorage.removeItem(NAKAMA_SESSION_KEY);
    } catch (error) {
      console.error('Failed to load stored Nakama session:', error);
      // Clear invalid session data
      await AsyncStorage.removeItem(NAKAMA_SESSION_KEY);
    }
  };

  const connect = async (username: string, email: string) => {
    try {
      const newSession = await createNakamaSession(username, email);
      
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


  const authenticateWithEmail = async (email: string, password: string) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No network connection available');
      }
      
      const session = await nakamaClient.authenticateEmail(email, password, true);
      
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
      console.error('Authentication failed:', error);
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
