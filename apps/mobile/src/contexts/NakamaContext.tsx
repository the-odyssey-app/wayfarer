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
  updateUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
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
        isAuthenticated: true,
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
        console.error(`RPC call ${functionName} failed: No active session`);
        throw new Error('No active session');
      }

      // Nakama RPC accepts payload as string or object
      // We'll pass it as a stringified JSON string
      const payloadString = payload ? JSON.stringify(payload) : '{}';
      console.log(`RPC call ${functionName} with payload:`, payloadString.substring(0, 200));
      
      const result = await nakamaClient.rpc(session.session, functionName, payloadString as any);
      
      console.log(`RPC call ${functionName} result:`, result ? JSON.stringify(result).substring(0, 200) : 'null/undefined');
      
      if (!result || result.payload === undefined) {
        console.error(`RPC call ${functionName} returned empty result. Full result:`, result);
        return { success: false, error: 'Empty response from server' };
      }
      
      // Parse the result if it's a JSON string
      // result.payload can be a string or already an object
      if (typeof result.payload === 'string') {
        try {
          const parsed = JSON.parse(result.payload);
          return parsed || { success: false, error: 'Invalid response format' };
        } catch {
          // If parsing fails, return the string as-is
          return { success: false, error: result.payload || 'Empty response from server' };
        }
      } else {
        // Already an object
        return result.payload || { success: false, error: 'Empty response from server' };
      }
    } catch (error) {
      console.error(`RPC call failed for ${functionName}:`, error);
      // Return error object instead of throwing to allow caller to handle gracefully
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      if (!session?.session) {
        return { success: false, error: 'No active session' };
      }

      if (!newUsername || !newUsername.trim()) {
        return { success: false, error: 'Username cannot be empty' };
      }

      // Use Nakama's updateAccount method to update username
      await nakamaClient.updateAccount(session.session, {
        username: newUsername.trim(),
      });

      // Update local session state
      const updatedSession = {
        ...session,
        username: newUsername.trim(),
      };
      setSession(updatedSession);

      // Update stored session
      await AsyncStorage.setItem(NAKAMA_SESSION_KEY, JSON.stringify({
        token: session.session.token,
        refresh_token: session.session.refresh_token,
        user_id: session.userId,
        username: newUsername.trim(),
      }));

      return { success: true };
    } catch (error) {
      console.error('Failed to update username:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update username' 
      };
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
    updateUsername,
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
